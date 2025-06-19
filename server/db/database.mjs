import sqlite3 from 'sqlite3';

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const DB_PATH = 'db/game.db';

// ==========================================
// DATABASE CONNECTION
// ==========================================

/**
 * Initialize SQLite database connection
 */
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    throw err;
  }
  console.log('Connected to SQLite database');
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Execute a single SQL statement with error handling
 * @param {string} sql - SQL statement to execute
 * @param {Array} params - Parameters for the SQL statement
 * @returns {Promise} Promise that resolves with the result
 */
const runSQL = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error(`SQL Error: ${err.message}`);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Get a single row from database
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Promise that resolves with the row
 */
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error(`SQL Error: ${err.message}`);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Get all rows from database
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Promise that resolves with the rows
 */
const getAllRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(`SQL Error: ${err.message}`);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Execute multiple SQL statements in a transaction
 * @param {Array} statements - Array of {sql, params} objects
 * @returns {Promise} Promise that resolves when transaction completes
 */
const executeTransaction = (statements) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let error = null;
      const results = [];
      
      statements.forEach(({ sql, params = [] }) => {
        db.run(sql, params, function(err) {
          if (err) {
            error = err;
          } else {
            results.push({ id: this.lastID, changes: this.changes });
          }
        });
      });
      
      if (error) {
        db.run('ROLLBACK', () => {
          reject(error);
        });
      } else {
        db.run('COMMIT', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
      }
    });
  });
};

// ==========================================
// SCHEMA INITIALIZATION
// ==========================================

/**
 * Database table schemas
 */
const SCHEMAS = {
  users: `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    salt TEXT
  )`,
  
  cards: `CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    misfortune_index REAL NOT NULL
  )`,
  
  games: `CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    result TEXT,
    incorrect_attempts INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,
  
  game_cards: `CREATE TABLE IF NOT EXISTS game_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    acquisition_order INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (card_id) REFERENCES cards (id)
  )`,
  
  game_rounds: `CREATE TABLE IF NOT EXISTS game_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    presented_card_id INTEGER NOT NULL,
    chosen_position INTEGER NOT NULL,
    correct_position INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (presented_card_id) REFERENCES cards (id)
  )`
};

/**
 * Initialize database schema
 * @returns {Promise} Promise that resolves when schema is created
 */
export const initializeDB = async () => {
  try {
    const statements = Object.values(SCHEMAS).map(sql => ({ sql }));
    await executeTransaction(statements);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

// ==========================================
// SCHEMA UPDATES
// ==========================================

/**
 * Update database schema if needed
 * @returns {Promise} Promise that resolves when schema is updated
 */
export const updateDBSchema = async () => {
  try {
    // Check if email column exists in users table and remove it
    const userTableInfo = await getAllRows('PRAGMA table_info(users)');
    const hasEmailColumn = userTableInfo.some(col => col && col.name === 'email');
    
    if (hasEmailColumn) {
      // Create new table without email column
      await runSQL(`CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        salt TEXT
      )`);
      
      // Copy data from old table to new table
      await runSQL(`INSERT INTO users_new (id, username, password, salt) 
                   SELECT id, username, password, salt FROM users`);
      
      // Drop old table and rename new table
      await runSQL('DROP TABLE users');
      await runSQL('ALTER TABLE users_new RENAME TO users');
      
      console.log('Removed email column from users table');
    }
    
    // Check if incorrect_attempts column exists in the games table
    const gameTableInfo = await getAllRows('PRAGMA table_info(games)');
    
    const hasIncorrectAttempts = gameTableInfo.some(col => 
      col && col.name === 'incorrect_attempts'
    );
    
    if (!hasIncorrectAttempts) {
      await runSQL('ALTER TABLE games ADD COLUMN incorrect_attempts INTEGER DEFAULT 0');
      console.log('Added incorrect_attempts column to games table');
    }
    
    // Check if game_rounds table exists
    const tables = await getAllRows('SELECT name FROM sqlite_master WHERE type="table"');
    const hasGameRounds = tables.some(table => table.name === 'game_rounds');
    
    if (!hasGameRounds) {
      await runSQL(SCHEMAS.game_rounds);
      console.log('Created game_rounds table');
    }
  } catch (error) {
    console.error('Error updating database schema:', error);
    throw error;
  }
};

// ==========================================
// DATABASE RESET
// ==========================================

/**
 * Drop tables in correct order to avoid foreign key constraints
 */
const DROP_ORDER = ['game_rounds', 'game_cards', 'games', 'cards', 'users'];

/**
 * Reset the entire database - WARNING: This deletes all data!
 * @returns {Promise} Promise that resolves when database is reset
 */
export const resetDB = async () => {
  try {
    // Drop all tables in reverse order
    for (const tableName of DROP_ORDER) {
      await runSQL(`DROP TABLE IF EXISTS ${tableName}`);
    }
    
    // Recreate schema
    await initializeDB();
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================

export { runSQL, getRow, getAllRows, executeTransaction };
export default db;
