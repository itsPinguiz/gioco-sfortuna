import { runSQL, getRow, getAllRows, executeTransaction } from './database.mjs';
import { misfortuneCards, sampleUsers } from '../data/sampleData.mjs';
import crypt from '../utils/crypt.mjs';

// ==========================================
// CONSTANTS
// ==========================================

const SAMPLE_GAME_CONFIG = {
  WON_GAME: {
    result: 'won',
    cardCount: 6,
    dateOffset: '-2 day'
  },
  LOST_GAME: {
    result: 'lost',
    cardCount: 4,
    dateOffset: '-1 day'
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Checks if a table is empty
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} Whether the table is empty
 */
const isTableEmpty = async (tableName) => {
  try {
    const result = await getRow(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result.count === 0;
  } catch (error) {
    console.error(`Error checking ${tableName} table:`, error);
    throw error;
  }
};

/**
 * Gets random cards from database
 * @param {number} count - Number of cards to get
 * @returns {Promise<Array>} Array of random cards
 */
const getRandomCards = async (count) => {
  try {
    const cards = await getAllRows('SELECT * FROM cards ORDER BY RANDOM() LIMIT ?', [count]);
    return cards;
  } catch (error) {
    console.error('Error getting random cards:', error);
    throw error;
  }
};

// ==========================================
// INITIALIZATION FUNCTIONS
// ==========================================

/**
 * Initializes cards table with sample data
 * @returns {Promise<void>}
 */
const initializeCards = async () => {
  try {
    console.log('Checking cards table...');
    
    if (await isTableEmpty('cards')) {
      console.log('Initializing cards with sample data...');
      
      // Prepare transaction statements
      const statements = misfortuneCards.map(card => ({
        sql: 'INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)',
        params: [card.name, card.image_url, card.misfortune_index]
      }));
      
      await executeTransaction(statements);
      console.log(`Added ${misfortuneCards.length} cards to database`);
    } else {
      console.log('Cards table already has data, skipping...');
    }
  } catch (error) {
    console.error('Error initializing cards:', error);
    throw error;
  }
};

/**
 * Initializes users table with sample data
 * @returns {Promise<void>}
 */
const initializeUsers = async () => {
  try {
    console.log('Checking users table...');
    
    if (await isTableEmpty('users')) {
      console.log('Initializing users with sample data...');
      
      // Prepare user statements with hashed passwords
      const statements = sampleUsers.map(user => {
        const salt = crypt.generateSalt();
        const hashedPassword = crypt.hashPassword(user.password, salt);
        
        return {
          sql: 'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)',
          params: [user.username, hashedPassword, salt]
        };
      });
      
      await executeTransaction(statements);
      console.log(`Added ${sampleUsers.length} users to database`);
    } else {
      console.log('Users table already has data, skipping...');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
};

/**
 * Creates sample rounds for a game
 * @param {number} gameId - Game ID
 * @param {Array} gameCards - Cards in the game (sorted by acquisition order)
 * @param {string} gameResult - Game result ('won' or 'lost')
 * @returns {Promise<void>}
 */
const createSampleRounds = async (gameId, gameCards, gameResult) => {
  try {
    // Sort cards by misfortune index to simulate correct placement
    const sortedCards = [...gameCards].sort((a, b) => a.misfortune_index - b.misfortune_index);
    
    const roundStatements = [];
    
    // Create rounds for each card (starting from the 4th card since first 3 are initial hand)
    for (let i = 3; i < gameCards.length; i++) {
      const roundNumber = i - 2; // Round 1, 2, 3, etc.
      const presentedCard = gameCards[i]; // Card that was presented to user
      const cardsInHandAtTime = gameCards.slice(0, i); // Cards in hand at the time
      
      // Calculate what the correct position would have been
      let correctPosition = 0;
      const sortedHandCards = [...cardsInHandAtTime].sort((a, b) => a.misfortune_index - b.misfortune_index);
      
      for (let j = 0; j < sortedHandCards.length; j++) {
        if (presentedCard.misfortune_index > sortedHandCards[j].misfortune_index) {
          correctPosition = j + 1;
        }
      }
      
      // For sample games, simulate some realistic gameplay:
      let chosenPosition, isCorrect;
      
      if (gameResult === 'won') {
        // Won games: most rounds are correct, maybe 1-2 incorrect attempts
        if (roundNumber <= gameCards.length - 4 || Math.random() > 0.3) {
          // Correct placement
          chosenPosition = correctPosition;
          isCorrect = true;
        } else {
          // Incorrect placement (simulate user error)
          chosenPosition = Math.max(0, correctPosition + (Math.random() > 0.5 ? 1 : -1));
          chosenPosition = Math.min(chosenPosition, sortedHandCards.length);
          isCorrect = false;
        }
      } else {
        // Lost games: mix of correct and incorrect, with final rounds being incorrect
        if (roundNumber < 2 && Math.random() > 0.4) {
          // Some early correct placements
          chosenPosition = correctPosition;
          isCorrect = true;
        } else {
          // More incorrect placements leading to loss
          chosenPosition = Math.max(0, correctPosition + (Math.random() > 0.5 ? 1 : -1));
          chosenPosition = Math.min(chosenPosition, sortedHandCards.length);
          isCorrect = false;
        }
      }
      
      // Add some random time taken (between 5-25 seconds)
      const timeTaken = Math.floor(Math.random() * 20) + 5;
      
      roundStatements.push({
        sql: `INSERT INTO game_rounds 
              (game_id, round_number, presented_card_id, chosen_position, correct_position, is_correct, time_taken, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now", ?))`,
        params: [
          gameId, 
          roundNumber, 
          presentedCard.id, 
          chosenPosition, 
          correctPosition, 
          isCorrect, 
          timeTaken,
          gameResult === 'won' ? '-2 day' : '-1 day' // Match the game dates
        ]
      });
    }
    
    if (roundStatements.length > 0) {
      await executeTransaction(roundStatements);
      console.log(`Created ${roundStatements.length} sample rounds for ${gameResult} game`);
    }
  } catch (error) {
    console.error(`Error creating sample rounds for ${gameResult} game:`, error);
    throw error;
  }
};

/**
 * Creates a sample game with cards and rounds
 * @param {number} userId - User ID for the game
 * @param {Object} gameConfig - Game configuration
 * @returns {Promise<void>}
 */
const createSampleGame = async (userId, gameConfig) => {
  try {
    // Create the game
    const gameResult = await runSQL(
      `INSERT INTO games (user_id, start_date, end_date, result) 
       VALUES (?, datetime("now", ?), datetime("now", ?), ?)`,
      [userId, gameConfig.dateOffset, gameConfig.dateOffset, gameConfig.result]
    );
    
    const gameId = gameResult.id;
    
    // Get random cards for the game
    const cards = await getRandomCards(gameConfig.cardCount);
    
    // Add cards to the game
    const cardStatements = cards.map((card, index) => ({
      sql: 'INSERT INTO game_cards (game_id, card_id, acquisition_order) VALUES (?, ?, ?)',
      params: [gameId, card.id, index + 1]
    }));
    
    await executeTransaction(cardStatements);
    
    // Create sample rounds for the game (if it has more than 3 cards)
    if (gameConfig.cardCount > 3) {
      await createSampleRounds(gameId, cards, gameConfig.result);
    }
    
    console.log(`Created sample ${gameConfig.result} game with ${gameConfig.cardCount} cards`);
  } catch (error) {
    console.error(`Error creating sample ${gameConfig.result} game:`, error);
    throw error;
  }
};

/**
 * Initializes sample games for the first user
 * @returns {Promise<void>}
 */
const initializeSampleGames = async () => {
  try {
    console.log('Checking for sample games...');
    
    // Get the first user
    const firstUser = await getRow('SELECT * FROM users LIMIT 1');
    
    if (!firstUser) {
      console.log('No users found, skipping sample games creation');
      return;
    }
    
    // Check if user already has games
    const existingGames = await getRow(
      'SELECT COUNT(*) as count FROM games WHERE user_id = ?', 
      [firstUser.id]
    );
    
    if (existingGames.count === 0) {
      console.log('Creating sample games for first user...');
      
      // Create won game
      await createSampleGame(firstUser.id, SAMPLE_GAME_CONFIG.WON_GAME);
      
      // Create lost game
      await createSampleGame(firstUser.id, SAMPLE_GAME_CONFIG.LOST_GAME);
      
      console.log('Sample games created successfully');
    } else {
      console.log('User already has games, skipping sample games creation');
    }
  } catch (error) {
    console.error('Error initializing sample games:', error);
    throw error;
  }
};

// ==========================================
// MAIN INITIALIZATION FUNCTION
// ==========================================

/**
 * Main function to initialize the database with sample data
 * Initializes cards, users, and sample games in sequence
 * @returns {Promise<void>}
 */
const initializeSampleData = async () => {
  try {
    console.log('Starting database initialization with sample data...');
    
    // Initialize in sequence to handle dependencies
    await initializeCards();
    await initializeUsers();
    await initializeSampleGames();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

export default initializeSampleData;
