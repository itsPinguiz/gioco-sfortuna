import db from './database.mjs';

// DAO for Card operations
const cardDao = {
  
  // Get all cards
  getAllCards: () => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM cards';
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Get card by id
  getCardById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM cards WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Get random cards excluding specific card IDs
  getRandomCards: (count, excludeIds = []) => {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM cards';
      
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map(() => '?').join(',');
        sql += ` WHERE id NOT IN (${placeholders})`;
      }
      
      sql += ' ORDER BY RANDOM() LIMIT ?';
      
      const params = [...excludeIds, count];
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  // Add a new card
  addCard: (card) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)';
      db.run(sql, [card.name, card.image_url, card.misfortune_index], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...card });
        }
      });
    });
  },
  
  // Add multiple cards
  addCards: (cards) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO cards (name, image_url, misfortune_index) VALUES (?, ?, ?)';
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmt = db.prepare(sql);
        const insertedIds = [];
        
        let error = null;
        cards.forEach((card) => {
          stmt.run([card.name, card.image_url, card.misfortune_index], function(err) {
            if (err) {
              error = err;
            } else {
              insertedIds.push(this.lastID);
            }
          });
        });
        
        stmt.finalize();
        
        if (error) {
          db.run('ROLLBACK');
          reject(error);
        } else {
          db.run('COMMIT');
          resolve(insertedIds);
        }
      });
    });
  }
};

export default cardDao;
