import { getRow } from './database.mjs';
import crypto from 'crypto';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Remove sensitive fields from user object
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, salt, ...sanitizedUser } = user;
  return sanitizedUser;
};

/**
 * Validate user credentials using crypto
 * @param {string} inputPassword - Password to check
 * @param {string} storedPassword - Stored hashed password
 * @param {string} salt - Password salt
 * @returns {boolean} Whether credentials are valid
 */
const validatePassword = (inputPassword, storedPassword, salt) => {
  try {
    const hashedPassword = crypto.scryptSync(inputPassword, salt, 32).toString('hex');
    return hashedPassword === storedPassword;
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
};

// ==========================================
// USER DAO
// ==========================================

/**
 * Data Access Object for User operations
 * Handles all user-related database interactions
 */
const userDao = {
  
  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object without sensitive data
   */
  getUserById: async (id) => {
    try {
      const sql = 'SELECT * FROM users WHERE id = ?';
      const user = await getRow(sql, [id]);
      
      if (!user) {
        return null;
      }
      
      return sanitizeUser(user);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  },

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object with sensitive data (for authentication)
   */
  getUserByUsername: async (username) => {
    try {
      const sql = 'SELECT * FROM users WHERE username = ?';
      return await getRow(sql, [username]);
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  },

  /**
   * Check user credentials and return user if valid
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object|false>} User object (sanitized) or false if invalid
   */
  checkCredentials: async (username, password) => {
    try {
      const user = await userDao.getUserByUsername(username);
      
      if (!user) {
        return false;
      }
      
      const isValidPassword = validatePassword(password, user.password, user.salt);
      
      if (isValidPassword) {
        return sanitizeUser(user);
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
      throw error;
    }
  }
};

export default userDao;
     