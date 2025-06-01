import db from './database.mjs';

// DAO for Game operations
const gameDao = {
  
  // Create a new game
  createGame: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO games (user_id, start_date) VALUES (?, datetime("now"))';
      db.run(sql, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, user_id: userId, start_date: new Date() });
        }
      });
    });
  },

  // End a game
  endGame: (gameId, result) => {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE games SET end_date = datetime("now"), result = ? WHERE id = ?';
      db.run(sql, [result, gameId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Game not found'));
        } else {
          resolve({ gameId, result, end_date: new Date() });
        }
      });
    });
  },
  // Add a card to a game
  addCardToGame: (gameId, cardId, order) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO game_cards (game_id, card_id, acquisition_order) VALUES (?, ?, ?)';
      db.run(sql, [gameId, cardId, order], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, game_id: gameId, card_id: cardId, acquisition_order: order });
        }
      });
    });
  },

  // Increment incorrect attempts
  incrementIncorrectAttempts: (gameId) => {
    return new Promise((resolve, reject) => {
      // First get the current count
      const getCountSql = 'SELECT incorrect_attempts FROM games WHERE id = ?';
      db.get(getCountSql, [gameId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          reject(new Error('Game not found'));
          return;
        }

        const currentCount = row.incorrect_attempts || 0;
        const newCount = currentCount + 1;
        
        // Update the count
        const updateSql = 'UPDATE games SET incorrect_attempts = ? WHERE id = ?';
        db.run(updateSql, [newCount, gameId], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              gameId, 
              incorrectAttempts: newCount, 
              reachedMaxAttempts: newCount >= 3 
            });
          }
        });
      });
    });
  },

  // Get cards from a game
  getGameCards: (gameId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT c.*, gc.acquisition_order
        FROM cards c
        JOIN game_cards gc ON c.id = gc.card_id
        WHERE gc.game_id = ?
        ORDER BY gc.acquisition_order
      `;
      db.all(sql, [gameId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get games history for a user
  getUserGames: (userId) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT g.*,
               COUNT(gc.id) as cards_count
        FROM games g
        LEFT JOIN game_cards gc ON g.id = gc.game_id
        WHERE g.user_id = ?
        GROUP BY g.id
        ORDER BY g.start_date DESC
      `;
      db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get game details by ID
  getGameById: (gameId) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM games WHERE id = ?';
      db.get(sql, [gameId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

export default gameDao;
