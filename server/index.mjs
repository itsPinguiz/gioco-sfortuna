import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import cors from 'cors';
import morgan from 'morgan';
import { body, validationResult } from 'express-validator';
import path from 'path';
import { fileURLToPath } from 'url';

// ==========================================
// IMPORTS - DAOs AND UTILITIES
// ==========================================

import { initializeDB, updateDBSchema, resetDB } from './db/database.mjs';
import userDao from './db/userDao.mjs';
import cardDao from './db/cardDao.mjs';
import gameDao from './db/gameDao.mjs';
import initializeSampleData from './db/initDB.mjs';
import { createImagesDirectory } from './data/sampleData.mjs';

// ==========================================
// CONSTANTS
// ==========================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const SESSION_CONFIG = {
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    httpOnly: true,
    sameSite: 'lax'
  }
};

const GAME_CONFIG = {
  INITIAL_CARDS: 3,
  WINNING_CARDS: 6,
  MAX_ATTEMPTS: 3,
  TIMEOUT_POSITION: -1
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Handles validation errors in request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} Whether there are validation errors
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
};

/**
 * Checks if user can access a game
 * @param {Object} game - Game object
 * @param {Object} req - Express request object
 * @returns {boolean} Whether user can access the game
 */
const canAccessGame = (game, req) => {
  if (!game.user_id) return true; // Guest game
  return req.isAuthenticated() && req.user.id === game.user_id;
};

/**
 * Gets unique random cards for game initialization
 * @param {number} count - Number of cards to get
 * @returns {Promise<Array>} Array of unique cards
 */
const getUniqueRandomCards = async (count) => {
  const cards = await cardDao.getRandomCards(count);
  
  if (cards.length < count) {
    throw new Error('Not enough unique cards available');
  }
  
  // Verify uniqueness
  const uniqueIds = [...new Set(cards.map(card => card.id))];
  if (uniqueIds.length !== cards.length) {
    throw new Error('Duplicate cards detected in initial hand');
  }
  
  return cards;
};

// ==========================================
// EXPRESS APP SETUP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE SETUP
// ==========================================

// Basic middleware
app.use(express.json());
app.use(morgan('dev'));

// CORS setup
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session(SESSION_CONFIG));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ==========================================
// PASSPORT CONFIGURATION
// ==========================================

// Local strategy
passport.use(new LocalStrategy(async function verify(username, password, done) {
  try {
    const user = await userDao.checkCredentials(username, password);
    if (!user) {
      return done(null, false, { message: 'Incorrect username or password' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDao.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ==========================================
// MIDDLEWARE FUNCTIONS
// ==========================================

/**
 * Authentication middleware
 */
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// ==========================================
// GAME LOGIC FUNCTIONS
// ==========================================

/**
 * Creates initial game with cards
 * @param {number|null} userId - User ID or null for guest
 * @returns {Promise<Object>} Game object with cards
 */
const createGameWithCards = async (userId) => {
  const game = await gameDao.createGame(userId);
  const cards = await getUniqueRandomCards(GAME_CONFIG.INITIAL_CARDS);
  
  // Add cards to game
  const promises = cards.map((card, index) => 
    gameDao.addCardToGame(game.id, card.id, index + 1)
  );
  
  await Promise.all(promises);
  
  const gameCards = await gameDao.getGameCards(game.id);
  return { game, cards: gameCards };
};

/**
 * Calculates correct position for a card
 * @param {Array} gameCards - Current game cards
 * @param {Object} roundCard - Card to place
 * @returns {number} Correct position
 */
const calculateCorrectPosition = (gameCards, roundCard) => {
  const sortedCards = [...gameCards].sort((a, b) => a.misfortune_index - b.misfortune_index);
  
  let correctPosition = 0;
  for (let i = 0; i < sortedCards.length; i++) {
    if (roundCard.misfortune_index > sortedCards[i].misfortune_index) {
      correctPosition = i + 1;
    }
  }
  
  return correctPosition;
};

/**
 * Processes card placement result
 * @param {number} gameId - Game ID
 * @param {Object} roundCard - Card being placed
 * @param {number} position - Position where card is placed
 * @param {number} correctPosition - Correct position for the card
 * @param {number} gameCardsCount - Current number of cards in game
 * @param {boolean} isGuestGame - Whether this is a guest game
 * @returns {Promise<Object>} Placement result
 */
const processCardPlacement = async (gameId, roundCard, position, correctPosition, gameCardsCount, isGuestGame = false) => {
  const isTimeout = position === GAME_CONFIG.TIMEOUT_POSITION;
  const isCorrect = !isTimeout && position === correctPosition;
  
  if (isCorrect) {
    // Add card to game
    await gameDao.addCardToGame(gameId, roundCard.id, gameCardsCount + 1);
    
    // For guest games, end after first correct placement
    if (isGuestGame) {
      await gameDao.endGame(gameId, 'won');
      return {
        result: 'correct',
        card: roundCard,
        gameCompleted: true,
        gameResult: 'won',
        isGuestGame: true,
        message: 'Complimenti! Hai completato la partita demo. Registrati per giocare partite complete!'
      };
    }
    
    // Check for win condition (authenticated users)
    if (gameCardsCount + 1 >= GAME_CONFIG.WINNING_CARDS) {
      await gameDao.endGame(gameId, 'won');
      return {
        result: 'correct',
        card: roundCard,
        gameCompleted: true,
        gameResult: 'won'
      };
    }
    
    return {
      result: 'correct',
      card: roundCard,
      gameCompleted: false
    };
  } else {
    // Handle incorrect placement
    const attemptResult = await gameDao.incrementIncorrectAttempts(gameId);
    
    // For guest games, end after first incorrect attempt
    if (isGuestGame) {
      await gameDao.endGame(gameId, 'lost');
      return {
        result: 'incorrect',
        card: roundCard,
        correctPosition,
        incorrectAttempts: attemptResult.incorrectAttempts,
        gameCompleted: true,
        gameResult: 'lost',
        isGuestGame: true,
        message: 'Partita demo terminata. Registrati per giocare partite complete con 3 tentativi!'
      };
    }
    
    const response = {
      result: 'incorrect',
      card: roundCard,
      correctPosition,
      incorrectAttempts: attemptResult.incorrectAttempts,
      gameCompleted: attemptResult.reachedMaxAttempts
    };
    
    if (attemptResult.reachedMaxAttempts) {
      await gameDao.endGame(gameId, 'lost');
      response.gameResult = 'lost';
    }
    
    return response;
  }
};

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.json(req.user);
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.json({});
  });
});

// ==========================================
// GAME ROUTES
// ==========================================

// Create new game
app.post('/api/games', async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const result = await createGameWithCards(userId);
    res.json(result);
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Get game details
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await gameDao.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (!canAccessGame(game, req)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const cards = await gameDao.getGameCards(gameId);
    res.json({ game, cards });
  } catch (err) {
    console.error('Error getting game details:', err);
    res.status(500).json({ error: 'Failed to get game details' });
  }
});

// Get games history (authenticated users only)
app.get('/api/games', isLoggedIn, async (req, res) => {
  try {
    const games = await gameDao.getUserGames(req.user.id);
    res.json(games);
  } catch (err) {
    console.error('Error getting games history:', err);
    res.status(500).json({ error: 'Failed to get games history' });
  }
});

// Get round card
app.get('/api/games/:id/round', async (req, res) => {
  try {
    const gameId = req.params.id;
    const game = await gameDao.getGameById(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (!canAccessGame(game, req)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const gameCards = await gameDao.getGameCards(gameId);
    const cardIds = gameCards.map(card => card.id);
    const randomCards = await cardDao.getRandomCards(1, cardIds);
    
    if (randomCards.length === 0) {
      return res.status(404).json({ error: 'No more cards available' });
    }
    
    // Return card without misfortune index
    const { misfortune_index, ...cardWithoutIndex } = randomCards[0];
    res.json(cardWithoutIndex);
  } catch (err) {
    console.error('Error getting round card:', err);
    res.status(500).json({ error: 'Failed to get round card' });
  }
});

// Submit card placement
app.post('/api/games/:id/round',
  body('cardId').isInt().withMessage('Card ID must be an integer'),
  body('position').isInt({ min: -1 }).withMessage('Position must be -1 or non-negative integer'),
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    
    try {
      const gameId = req.params.id;
      const { cardId, position } = req.body;
      
      const game = await gameDao.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      if (!canAccessGame(game, req)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const gameCards = await gameDao.getGameCards(gameId);
      const roundCard = await cardDao.getCardById(cardId);
      
      if (!roundCard) {
        return res.status(404).json({ error: 'Card not found' });
      }
      
      const correctPosition = calculateCorrectPosition(gameCards, roundCard);
      
      // Check if this is a guest game (no user_id)
      const isGuestGame = !game.user_id;
      
      const result = await processCardPlacement(
        gameId, 
        roundCard, 
        position, 
        correctPosition, 
        gameCards.length,
        isGuestGame
      );
      
      res.json(result);
    } catch (err) {
      console.error('Error processing round:', err);
      res.status(500).json({ error: 'Failed to process round' });
    }
  }
);

// End game
app.post('/api/games/:id/end',
  body('result').isString().withMessage('Result must be a string'),
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    
    try {
      const gameId = req.params.id;
      const { result } = req.body;
      
      const game = await gameDao.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      if (!canAccessGame(game, req)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const endedGame = await gameDao.endGame(gameId, result);
      res.json(endedGame);
    } catch (err) {
      console.error('Error ending game:', err);
      res.status(500).json({ error: 'Failed to end game' });
    }
  }
);

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

/**
 * Initialize the application
 */
const initializeApp = async () => {
  try {
    console.log('Initializing application...');
    
    // Uncomment to reset database
    // await resetDB();
    
    await initializeDB();
    await updateDBSchema();
    
    createImagesDirectory();
    await initializeSampleData();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    throw error;
  }
};

// ==========================================
// SERVER STARTUP
// ==========================================

initializeApp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize application:', err);
    process.exit(1);
  });