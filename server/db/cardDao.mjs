import { runSQL, getRow, getAllRows, executeTransaction } from './database.mjs';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate card data
 * @param {Object} card - Card object to validate
 * @returns {boolean} Whether card data is valid
 */
const validateCardData = (card) => {
  return card && 
         typeof card.name === 'string' && 
         typeof card.image_url === 'string' && 
         typeof card.misfortune_index === 'number' &&
         card.misfortune_index >= 0 && 
         card.misfortune_index <= 100;
};

/**
 * Ensure unique cards in array
 * @param {Array} cards - Array of cards
 * @returns {Array} Array with unique cards only
 */
const ensureUniqueCards = (cards) => {
  const uniqueCards = [];
  const seenIds = new Set();
  
  for (const card of cards) {
    if (!seenIds.has(card.id)) {
      uniqueCards.push(card);
      seenIds.add(card.id);
    }
  }
  
  return uniqueCards;
};

/**
 * Build SQL query for random cards with exclusions
 * @param {Array} excludeIds - Array of card IDs to exclude
 * @returns {Object} SQL query and parameters
 */
const buildRandomCardsQuery = (excludeIds = []) => {
  let sql = 'SELECT * FROM cards';
  let params = [];
  
  // Only add WHERE clause if there are valid IDs to exclude
  if (Array.isArray(excludeIds) && excludeIds.length > 0) {
    // Filter out any invalid IDs for extra safety
    const validIds = excludeIds.filter(id => 
      id != null && Number.isInteger(Number(id))
    );
    
    if (validIds.length > 0) {
      const placeholders = validIds.map(() => '?').join(',');
      sql += ` WHERE id NOT IN (${placeholders})`;
      params = [...validIds];
    }
  }
  
  sql += ' ORDER BY RANDOM() LIMIT ?';
  
  return { sql, params };
};

// ==========================================
// CARD DAO
// ==========================================

/**
 * Data Access Object for Card operations
 * Handles all card-related database interactions
 */
const cardDao = {
  
  /**
   * Get all cards from database
   * @returns {Promise<Array>} Array of all cards
   */
  getAllCards: async () => {
    try {
      const sql = 'SELECT * FROM cards ORDER BY misfortune_index';
      return await getAllRows(sql);
    } catch (error) {
      console.error('Error getting all cards:', error);
      throw error;
    }
  },

  /**
   * Get card by ID
   * @param {number} id - Card ID
   * @returns {Promise<Object|null>} Card object or null if not found
   */
  getCardById: async (id) => {
    try {
      const sql = 'SELECT * FROM cards WHERE id = ?';
      return await getRow(sql, [id]);
    } catch (error) {
      console.error('Error getting card by ID:', error);
      throw error;
    }
  },
  /**
   * Get random cards excluding specific IDs
   * @param {number} count - Number of cards to retrieve
   * @param {Array} excludeIds - Array of card IDs to exclude
   * @returns {Promise<Array>} Array of random cards
   */
  getRandomCards: async (count, excludeIds = []) => {
    try {
      // Validate input parameters
      if (!Number.isInteger(count) || count <= 0) {
        throw new Error(`Invalid count parameter: ${count}`);
      }
      
      if (!Array.isArray(excludeIds)) {
        console.warn('excludeIds is not an array, converting:', excludeIds);
        excludeIds = [];
      }
      
      // Filter and validate exclude IDs
      const validExcludeIds = excludeIds.filter(id => 
        id != null && Number.isInteger(Number(id))
      ).map(id => Number(id));
      
      if (validExcludeIds.length !== excludeIds.length) {
        console.warn(`Filtered out ${excludeIds.length - validExcludeIds.length} invalid exclude IDs`);
      }
      
      const { sql, params } = buildRandomCardsQuery(validExcludeIds);
      params.push(count);
      
      const cards = await getAllRows(sql, params);
      
      // Ensure uniqueness as extra safety measure
      const uniqueCards = ensureUniqueCards(cards);
      
      // Additional validation: verify no excluded cards are in result
      if (validExcludeIds.length > 0) {
        const resultIds = uniqueCards.map(card => card.id);
        const duplicates = resultIds.filter(id => validExcludeIds.includes(id));
        
        if (duplicates.length > 0) {
          console.error('CRITICAL: Excluded cards found in result!');
          console.error('Excluded IDs:', validExcludeIds);
          console.error('Result IDs:', resultIds);
          console.error('Duplicates:', duplicates);
          throw new Error(`Excluded cards found in result: ${duplicates.join(', ')}`);
        }
      }

      return uniqueCards;
    } catch (error) {
      console.error('Error getting random cards:', error);
      throw error;
    }
  },

  /**
   * Add a single card to database
   * @param {Object} card - Card object to add
   * @returns {Promise<Object>} Created card with ID
   */
  addCard: async (card) => {
    try {
      if (!validateCardData(card)) {
        throw new Error('Invalid card data');
      }

      const sql = 'INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)';
      const result = await runSQL(sql, [card.name, card.image_url, card.misfortune_index]);
      
      return { id: result.id, ...card };
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  },

  /**
   * Add multiple cards to database in a transaction
   * @param {Array} cards - Array of card objects to add
   * @returns {Promise<Array>} Array of inserted card IDs
   */
  addCards: async (cards) => {
    try {
      // Validate all cards first
      for (const card of cards) {
        if (!validateCardData(card)) {
          throw new Error(`Invalid card data: ${JSON.stringify(card)}`);
        }
      }

      // Prepare transaction statements
      const statements = cards.map(card => ({
        sql: 'INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)',
        params: [card.name, card.image_url, card.misfortune_index]
      }));

      const results = await executeTransaction(statements);
      return results.map(result => result.id);
    } catch (error) {
      console.error('Error adding multiple cards:', error);
      throw error;
    }
  },

  /**
   * Get cards by misfortune index range
   * @param {number} minIndex - Minimum misfortune index
   * @param {number} maxIndex - Maximum misfortune index
   * @returns {Promise<Array>} Array of cards in range
   */
  getCardsByMisfortuneRange: async (minIndex, maxIndex) => {
    try {
      const sql = `
        SELECT * FROM cards 
        WHERE misfortune_index >= ? AND misfortune_index <= ?
        ORDER BY misfortune_index
      `;
      return await getAllRows(sql, [minIndex, maxIndex]);
    } catch (error) {
      console.error('Error getting cards by misfortune range:', error);
      throw error;
    }
  },

  /**
   * Get total count of cards
   * @returns {Promise<number>} Total number of cards
   */
  getCardCount: async () => {
    try {
      const sql = 'SELECT COUNT(*) as count FROM cards';
      const result = await getRow(sql);
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting card count:', error);
      throw error;
    }
  }
};

export default cardDao;
