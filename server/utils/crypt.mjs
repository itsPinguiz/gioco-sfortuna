import bcrypt from 'bcrypt';

// ==========================================
// CONSTANTS
// ==========================================

const SALT_ROUNDS = 10;

// ==========================================
// CRYPTO UTILITIES
// ==========================================

/**
 * Cryptographic utility functions for password management
 * Uses bcrypt for secure password hashing with salt
 */
const crypt = {
  /**
   * Generates a salt for password hashing
   * @returns {string} Generated salt
   */
  generateSalt: () => {
    try {
      return bcrypt.genSaltSync(SALT_ROUNDS);
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
      
      return bcrypt.hashSync(plainPassword, salt);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  },
  
  /**
   * Verifies a password against a hash
   * @param {string} plainPassword - Plain text password to verify
   * @param {string} hashedPassword - Hashed password to compare against
   * @returns {boolean} Whether the password matches
   */
  verifyPassword: (plainPassword, hashedPassword) => {
    try {
      if (!plainPassword || !hashedPassword) {
        return false;
      }
      
      return bcrypt.compareSync(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
};

export default crypt;
