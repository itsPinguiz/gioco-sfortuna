import { runSQL, getRow, getAllRows } from './database.mjs';

// ==========================================
// CONSTANTS
// ==========================================

const MAX_INCORRECT_ATTEMPTS = 3;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate game ownership
 * @param {Object} game - Game object
 * @param {number} userId - User ID to check
 * @returns {boolean} Whether user owns the game
 */
const validateGameOwnership = (game, userId) => {
  return game && game.user_id === userId;
};

/**
 * Check if game is completed
 * @param {Object} game - Game object
 * @returns {boolean} Whether game is completed
 */
const isGameCompleted = (game) => {
  return game && (game.end_date || game.result);
};

// ==========================================
// GAME DAO
// ==========================================

/**
 * Data Access Object for Game operations
 * Handles all game-related database interactions
 */
const gameDao = {
  
  /**
   * Create a new game for a user
   * @param {number} userId - User ID (can be null for guest games)
   * @returns {Promise<Object>} Created game object
   */
  createGame: async (userId) => {
    try {
      const sql = 'INSERT INTO games (user_id, start_date) VALUES (?, datetime("now"))';
      const result = await runSQL(sql, [userId]);
      
      // Return the created game
      return await gameDao.getGameById(result.id);
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },

  /**
   * End a game with result
   * @param {number} gameId - Game ID
   * @param {string} result - Game result ('won' or 'lost')
   * @returns {Promise<Object>} Updated game object
   */
  endGame: async (gameId, result) => {
    try {
      const sql = 'UPDATE games SET end_date = datetime("now"), result = ? WHERE id = ?';
      const updateResult = await runSQL(sql, [result, gameId]);
      
      if (updateResult.changes === 0) {
        throw new Error('Game not found');
      }
      
      // Return the updated game
      return await gameDao.getGameById(gameId);
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  },

  /**
   * Add a card to a game
   * @param {number} gameId - Game ID
   * @param {number} cardId - Card ID
   * @param {number} order - Acquisition order
   * @returns {Promise<Object>} Created game card relationship
   */
  addCardToGame: async (gameId, cardId, order) => {
    try {
      const sql = 'INSERT INTO game_cards (game_id, card_id, acquisition_order) VALUES (?, ?, ?)';
      const result = await runSQL(sql, [gameId, cardId, order]);
      
      return {
        id: result.id,
        game_id: gameId,
        card_id: cardId,
        acquisition_order: order
      };
    } catch (error) {
      console.error('Error adding card to game:', error);
      throw error;
    }
  },

  /**
   * Increment incorrect attempts for a game
   * @param {number} gameId - Game ID
   * @returns {Promise<Object>} Updated attempt info
   */
  incrementIncorrectAttempts: async (gameId) => {
    try {
      // Get current count
      const game = await gameDao.getGameById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const currentCount = game.incorrect_attempts || 0;
      const newCount = currentCount + 1;
      
      // Update the count
      const sql = 'UPDATE games SET incorrect_attempts = ? WHERE id = ?';
      await runSQL(sql, [newCount, gameId]);
      
      return {
        gameId,
        incorrectAttempts: newCount,
        reachedMaxAttempts: newCount >= MAX_INCORRECT_ATTEMPTS
      };
    } catch (error) {
      console.error('Error incrementing incorrect attempts:', error);
      throw error;
    }
  },

  /**
   * Get all cards associated with a game
   * @param {number} gameId - Game ID
   * @returns {Promise<Array>} Array of cards with acquisition order
   */
  getGameCards: async (gameId) => {
    try {
      const sql = `
        SELECT c.*, gc.acquisition_order
        FROM cards c
        JOIN game_cards gc ON c.id = gc.card_id
        WHERE gc.game_id = ?
        ORDER BY gc.acquisition_order
      `;
      return await getAllRows(sql, [gameId]);
    } catch (error) {
      console.error('Error getting game cards:', error);
      throw error;
    }
  },

  /**
   * Get games history for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of games with card counts
   */
  getUserGames: async (userId) => {
    try {
      const sql = `
        SELECT g.*,
               COUNT(gc.id) as cards_count
        FROM games g
        LEFT JOIN game_cards gc ON g.id = gc.game_id
        WHERE g.user_id = ?
        GROUP BY g.id
        ORDER BY g.start_date DESC
      `;
      return await getAllRows(sql, [userId]);
    } catch (error) {
      console.error('Error getting user games:', error);
      throw error;
    }
  },

  /**
   * Get game details by ID
   * @param {number} gameId - Game ID
   * @returns {Promise<Object|null>} Game object or null if not found
   */
  getGameById: async (gameId) => {
    try {
      const sql = 'SELECT * FROM games WHERE id = ?';
      return await getRow(sql, [gameId]);
    } catch (error) {
      console.error('Error getting game by ID:', error);
      throw error;
    }
  },

  /**
   * Get game with cards by ID
   * @param {number} gameId - Game ID
   * @returns {Promise<Object>} Game object with cards array
   */
  getGameWithCards: async (gameId) => {
    try {
      const game = await gameDao.getGameById(gameId);
      if (!game) {
        return null;
      }

      const cards = await gameDao.getGameCards(gameId);
      
      return {
        game,
        cards
      };
    } catch (error) {
      console.error('Error getting game with cards:', error);
      throw error;
    }
  }
};

export default gameDao;
