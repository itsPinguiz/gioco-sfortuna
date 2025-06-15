import sqlite3 from 'sqlite3';

// Open the database
const db = new sqlite3.Database('db/game.db', (err) => {
  if (err) throw err;
});

// Function to reset the entire database - WARNING: This deletes all data!
export const resetDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop all tables in reverse order to avoid foreign key constraints
      db.run(`DROP TABLE IF EXISTS game_cards`, (err) => {
        if (err) {
          console.error('Error dropping game_cards table:', err);
          reject(err);
          return;
        }
        
        db.run(`DROP TABLE IF EXISTS games`, (err) => {
          if (err) {
            console.error('Error dropping games table:', err);
            reject(err);
            return;
          }
          
          db.run(`DROP TABLE IF EXISTS cards`, (err) => {
            if (err) {
              console.error('Error dropping cards table:', err);
              reject(err);
              return;
            }
            
            db.run(`DROP TABLE IF EXISTS users`, (err) => {
              if (err) {
                console.error('Error dropping users table:', err);
                reject(err);
                return;
              }
              
              
              // After dropping all tables, initialize them again
              initializeDB()
                .then(() => {
                  resolve();
                })
                .catch((err) => {
                  console.error('Error recreating schema:', err);
                  reject(err);
                });
            });
          });
        });
      });
    });
  });
};

// Function to update database schema if needed
export const updateDBSchema = () => {
  return new Promise((resolve, reject) => {
    // Check if incorrect_attempts column exists in the games table
    db.all(`PRAGMA table_info(games)`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Check if the incorrect_attempts column exists
      const hasIncorrectAttempts = rows.some(col => col && col.name === 'incorrect_attempts');
      
      if (!hasIncorrectAttempts) {
        // Add the column if it doesn't exist
        db.run(`ALTER TABLE games ADD COLUMN incorrect_attempts INTEGER DEFAULT 0`, (err) => {
          if (err) {
            console.error('Error adding column:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
};

// Setup database structure
export const initializeDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        salt TEXT
      )`, (err) => {
        if (err) reject(err);
      });

      // Cards table for misfortune situations
      db.run(`CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        misfortune_index REAL NOT NULL
      )`, (err) => {
        if (err) reject(err);
      });      // Games table to track game sessions
      db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        start_date DATETIME NOT NULL,
        end_date DATETIME,
        result TEXT,
        incorrect_attempts INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`, (err) => {
        if (err) reject(err);
      });

      // Game_cards table to track cards obtained in a game
      db.run(`CREATE TABLE IF NOT EXISTS game_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        card_id INTEGER NOT NULL,
        acquisition_order INTEGER NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id),
        FOREIGN KEY (card_id) REFERENCES cards (id)
      )`, (err) => {
        if (err) reject(err);
      });

      resolve();
    });
  });
};

export default db;
