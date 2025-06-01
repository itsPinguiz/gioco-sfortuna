import bcrypt from 'bcrypt';

// Utility for password hashing and verification
const crypt = {
  // Generate a salt for password hashing
  generateSalt: () => {
    return bcrypt.genSaltSync(10);
  },
  
  // Hash a password using a salt
  hashPassword: (plainPassword, salt) => {
    return bcrypt.hashSync(plainPassword, salt);
  }
};

export default crypt;
