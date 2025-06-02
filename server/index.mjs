import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import cors from 'cors';
import morgan from 'morgan';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import DAOs and utility functions
import { initializeDB, updateDBSchema, resetDB } from './db/database.mjs';
import userDao from './db/userDao.mjs';
import cardDao from './db/cardDao.mjs';
import gameDao from './db/gameDao.mjs';
import crypt from './utils/crypt.mjs';
import initializeSampleData from './db/initDB.mjs';
import { misfortuneCards, sampleUsers, createImagesDirectory, createPlaceholderImages } from './data/sampleData.mjs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express application
const app = express();
const port = 3001;

// Set up middleware
app.use(express.json());
app.use(morgan('dev'));

// Set up CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Accetta tutte le richieste da localhost indipendentemente dalla porta
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Set up static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up session
app.use(session({
  secret: 'your_secret_key_here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Set up Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(new LocalStrategy(async function verify(username, password, done) {
  try {
    const user = await userDao.checkCredentials(username, password);
    if (!user)
      return done(null, false, { message: 'Incorrect username or password' });
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize and deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

// Initialize database and load sample data
const initializeApp = async () => {
  try {
    // Uncomment the following line to reset the database
    await resetDB();
    // console.log('✅ Database reset complete');
    
    // Initialize database structure
    await initializeDB();
    console.log('Database structure initialized');
    
    // Update database schema if needed
    await updateDBSchema();
    console.log('Database schema updated if needed');
    
    // Create images directory and placeholder images
    createImagesDirectory();
    createPlaceholderImages();
    console.log('Images directory and placeholders created');
    
    // Initialize database with sample data
    await initializeSampleData();
    console.log('Sample data initialized');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

// Authentication middleware
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// API Routes

// Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

// Authentication routes
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

// Game routes

// Start a new game
app.post('/api/games', (req, res) => {
  const userId = req.isAuthenticated() ? req.user.id : null;
    gameDao.createGame(userId)
    .then(game => {
      // Get 3 unique random cards for the game
      return cardDao.getRandomCards(3)
        .then(cards => {
          // Verify we got 3 unique cards
          if (cards.length < 3) {
            throw new Error('Not enough unique cards available');
          }
          
          // Verify uniqueness (extra safety check)
          const uniqueIds = [...new Set(cards.map(card => card.id))];
          if (uniqueIds.length !== cards.length) {
            throw new Error('Duplicate cards detected in initial hand');
          }
          
          // Add cards to the game
          const promises = cards.map((card, index) => 
            gameDao.addCardToGame(game.id, card.id, index + 1));
          
          return Promise.all(promises)
            .then(() => {
              // Get the game cards with details
              return gameDao.getGameCards(game.id)
                .then(gameCards => {
                  res.json({
                    game: game,
                    cards: gameCards
                  });
                });
            });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to create game' });
    });
});

// Get game details
app.get('/api/games/:id', (req, res) => {
  const gameId = req.params.id;
  
  gameDao.getGameById(gameId)
    .then(game => {
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      // Check if user can access this game
      if (game.user_id && (!req.isAuthenticated() || req.user.id !== game.user_id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get the game cards
      return gameDao.getGameCards(gameId)
        .then(cards => {
          res.json({
            game: game,
            cards: cards
          });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to get game details' });
    });
});

// Get games history (only for authenticated users)
app.get('/api/games', isLoggedIn, (req, res) => {
  gameDao.getUserGames(req.user.id)
    .then(games => {
      res.json(games);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to get games history' });
    });
});

// Get a random card for the current round, excluding cards already in the game
app.get('/api/games/:id/round', (req, res) => {
  const gameId = req.params.id;
  
  // First get the game to check access
  gameDao.getGameById(gameId)
    .then(game => {
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      // Check if user can access this game
      if (game.user_id && (!req.isAuthenticated() || req.user.id !== game.user_id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get current cards in the game
      return gameDao.getGameCards(gameId)
        .then(gameCards => {
          const cardIds = gameCards.map(card => card.id);
          
          // Get a random card excluding the ones already in the game
          return cardDao.getRandomCards(1, cardIds)
            .then(randomCards => {
              if (randomCards.length === 0) {
                return res.status(404).json({ error: 'No more cards available' });
              }
              
              // Return the card without the misfortune index
              const { misfortune_index, ...cardWithoutIndex } = randomCards[0];
              res.json(cardWithoutIndex);
            });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to get round card' });
    });
});

// Submit a placement for the current round
app.post('/api/games/:id/round', 
  body('cardId').isInt().withMessage('Card ID must be an integer'),
  body('position').isInt({ min: -1 }).withMessage('Position must be -1 or non-negative integer'),
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const gameId = req.params.id;
    const { cardId, position } = req.body;
    
    // First get the game to check access
    gameDao.getGameById(gameId)
      .then(game => {
        if (!game) {
          return res.status(404).json({ error: 'Game not found' });
        }
        
        // Check if user can access this game
        if (game.user_id && (!req.isAuthenticated() || req.user.id !== game.user_id)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        // Get current cards in the game
        return gameDao.getGameCards(gameId)
          .then(gameCards => {
            // Get the card for this round
            return cardDao.getCardById(cardId)
              .then(roundCard => {
                if (!roundCard) {
                  return res.status(404).json({ error: 'Card not found' });
                }
                
                // Sort game cards by misfortune index
                gameCards.sort((a, b) => a.misfortune_index - b.misfortune_index);
                  // Check if the position is correct
                let correctPosition = 0;
                for (let i = 0; i < gameCards.length; i++) {
                  if (roundCard.misfortune_index > gameCards[i].misfortune_index) {
                    correctPosition = i + 1;
                  }
                }
                
                // Se position è -1, significa che è scaduto il tempo (timeout) e quindi è sempre un errore
                const isCorrect = position >= 0 && position === correctPosition;
                
                if (isCorrect) {
                  // Add the card to the game
                  return gameDao.addCardToGame(gameId, cardId, gameCards.length + 1)
                    .then(() => {
                      // Check if the player has won (6 cards)
                      if (gameCards.length + 1 >= 6) {
                        return gameDao.endGame(gameId, 'won')
                          .then(() => {
                            res.json({
                              result: 'correct',
                              card: roundCard,
                              gameCompleted: true,
                              gameResult: 'won'
                            });
                          });
                      }
                      
                      // Return success but game not completed yet
                      res.json({
                        result: 'correct',
                        card: roundCard,
                        gameCompleted: false
                      });
                    });                } else {
                  // Log se la posizione è -1 (timeout)
                  if (position === -1) {
                    console.log('Timeout detected for game', gameId, '- Counting as incorrect attempt');
                  }
                  
                  // Increment the incorrect attempts counter
                  return gameDao.incrementIncorrectAttempts(gameId)
                    .then((result) => {
                      console.log('Incorrect attempt for game', gameId, '- Current count:', result.incorrectAttempts);
                      
                      // Check if this is the third incorrect placement
                      if (result.reachedMaxAttempts) {
                        console.log('Max attempts reached, ending game');
                        // End the game if we reached the maximum attempts (3)
                        return gameDao.endGame(gameId, 'lost')
                          .then(() => {
                            res.json({
                              result: 'incorrect',
                              card: roundCard,
                              gameCompleted: true,
                              gameResult: 'lost',
                              correctPosition: correctPosition,
                              incorrectAttempts: result.incorrectAttempts
                            });
                          });
                      } else {                        // Return incorrect result but game continues
                        res.json({
                          result: 'incorrect',
                          card: roundCard,
                          gameCompleted: false,
                          correctPosition: correctPosition,
                          incorrectAttempts: result.incorrectAttempts
                        });
                      }
                    });
                }
              });
          });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Failed to process round' });
      });
});

// End a game
app.post('/api/games/:id/end', 
  body('result').isString().withMessage('Result must be a string'),
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const gameId = req.params.id;
    const { result } = req.body;
    
    // Check if user can access this game
    gameDao.getGameById(gameId)
      .then(game => {
        if (!game) {
          return res.status(404).json({ error: 'Game not found' });
        }
        
        if (game.user_id && (!req.isAuthenticated() || req.user.id !== game.user_id)) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        return gameDao.endGame(gameId, result)
          .then(endedGame => {
            res.json(endedGame);
          });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Failed to end game' });
      });
});

// Initialize the application
initializeApp()
  .then(() => {
    // Start the server
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize application:', err);
    process.exit(1);
  });