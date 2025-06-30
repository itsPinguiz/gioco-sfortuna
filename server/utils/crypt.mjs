import crypto from 'crypto';

// ==========================================
// CONSTANTS
// ==========================================

const SALT_LENGTH = 32;

// ==========================================
// CRYPTO UTILITIES
// ==========================================

/**
 * Cryptographic utility functions for password management
 * Uses Node.js crypto module for secure password hashing with salt
 */
const crypt = {
  /**
   * Generates a salt for password hashing
   * @returns {string} Generated salt
   */
  generateSalt: () => {
    try {
      return crypto.randomBytes(SALT_LENGTH).toString('hex');
    } catch (error) {
      console.error('Error generating salt:', error);
      throw new Error('Failed to generate password salt');
    }
  },
  
  /**
   * Hashes a password using the provided salt
   * @param {string} plainPassword - Plain text password
   * @param {string} salt - Salt for hashing
   * @returns {string} Hashed password
   */
  hashPassword: (plainPassword, salt) => {
    try {
      if (!plainPassword || !salt) {
        throw new Error('Password and salt are required');
      }
      
      return crypto.scryptSync(plainPassword, salt, 32).toString('hex');
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  },
  
  /**
   * Verifies a password against a hash
   * @param {string} plainPassword - Plain text password to verify
   * @param {string} hashedPassword - Hashed password to compare against
   * @param {string} salt - Salt used for hashing
   * @returns {boolean} Whether the password matches
   */
  verifyPassword: (plainPassword, hashedPassword, salt) => {
    try {
      if (!plainPassword || !hashedPassword || !salt) {
        return false;
      }
      
      const hashedAttempt = crypto.scryptSync(plainPassword, salt, 32).toString('hex');
      return hashedAttempt === hashedPassword;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
};

export default crypt;
