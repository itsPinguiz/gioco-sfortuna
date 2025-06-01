import db from './database.mjs';
import bcrypt from 'bcrypt';

// DAO for User operations
const userDao = {
  
  // Get user by id
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err)
          reject(err);
        else if (row === undefined)
          resolve({ error: 'User not found.' });
        else {
          // Remove password and salt before returning the user
          const { password, salt, ...user } = row;
          resolve(user);
        }
      });
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err)
          reject(err);
        else
          resolve(row);
      });
    });
  },

  // Get user by username
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      db.get(sql, [username], (err, row) => {
        if (err)
          reject(err);
        else
          resolve(row);
      });
    });
  },

  // Check user credentials
  checkCredentials: (username, password) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(false);
        } else {
          const hashedPassword = bcrypt.hashSync(password, row.salt);
          if (hashedPassword === row.password) {
            // Remove password and salt before returning the user
            const { password, salt, ...user } = row;
            resolve(user);
          } else {
            resolve(false);
          }
        }
      });
    });
  },
};

export default userDao;
