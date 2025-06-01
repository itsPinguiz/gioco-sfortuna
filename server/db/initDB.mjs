import db from './database.mjs';
import bcrypt from 'bcrypt';
import { misfortuneCards, sampleUsers } from '../data/sampleData.mjs';
import crypt from '../utils/crypt.mjs';

// Function to initialize the database with sample data
const initializeSampleData = async () => {
  try {
    // Insert sample cards if the cards table is empty
    const countCards = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM cards', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });

    if (countCards === 0) {
      console.log('Adding sample cards to database...');
      
      // Add all cards in a transaction
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          const stmt = db.prepare('INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)');
          
          misfortuneCards.forEach(card => {
            stmt.run([card.name, card.image_url, card.misfortune_index], err => {
              if (err) {
                console.error('Error inserting card:', err);
              }
            });
          });
          
          stmt.finalize();
          
          db.run('COMMIT', err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
      
      console.log('Sample cards added successfully.');
    }

    // Insert sample users if the users table is empty
    const countUsers = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });

    if (countUsers === 0) {
      console.log('Adding sample users to database...');
      
      for (const user of sampleUsers) {
        const salt = crypt.generateSalt();
        const hashedPassword = crypt.hashPassword(user.password, salt);
        
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (email, username, password, salt) VALUES (?, ?, ?, ?)',
            [user.email, user.username, hashedPassword, salt],
            err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      }
      
      console.log('Sample users added successfully.');
    }
    
    // Optional: Add sample games for the first user
    const firstUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users LIMIT 1', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    if (firstUser) {
      const countGames = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [firstUser.id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        });
      });
      
      if (countGames === 0) {
        console.log('Adding sample games for first user...');
        
        // Create a completed game (won)
        const gameWon = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO games (user_id, start_date, end_date, result) VALUES (?, datetime("now", "-2 day"), datetime("now", "-2 day"), ?)',
            [firstUser.id, 'won'],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: this.lastID });
              }
            }
          );
        });
        
        // Add 6 cards to the won game
        const wonCards = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM cards ORDER BY RANDOM() LIMIT 6', [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
        
        for (let i = 0; i < wonCards.length; i++) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO game_cards (game_id, card_id, acquisition_order) VALUES (?, ?, ?)',
              [gameWon.id, wonCards[i].id, i + 1],
              err => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        }
        
        // Create a completed game (lost)
        const gameLost = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO games (user_id, start_date, end_date, result) VALUES (?, datetime("now", "-1 day"), datetime("now", "-1 day"), ?)',
            [firstUser.id, 'lost'],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: this.lastID });
              }
            }
          );
        });
        
        // Add 4 cards to the lost game
        const lostCards = await new Promise((resolve, reject) => {
          db.all('SELECT * FROM cards ORDER BY RANDOM() LIMIT 4', [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
        
        for (let i = 0; i < lostCards.length; i++) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO game_cards (game_id, card_id, acquisition_order) VALUES (?, ?, ?)',
              [gameLost.id, lostCards[i].id, i + 1],
              err => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          });
        }
        
        console.log('Sample games added successfully.');
      }
    }
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};

export default initializeSampleData;
