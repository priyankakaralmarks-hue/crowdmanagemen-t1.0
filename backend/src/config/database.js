const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'allocator.sqlite');

let sqlInstance = null;
let rawDb = null;
let inTransaction = false;

function saveDatabase() {
  if (rawDb && !inTransaction) {
    try {
      const data = rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('Error persisting database to disk:', e);
    }
  }
}

function formatResults(stmt) {
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

const db = {
  async init() {
    if (sqlInstance && rawDb) return db;
    sqlInstance = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        rawDb = new sqlInstance.Database(fileBuffer);
      } catch (err) {
        console.warn('Could not read existing db, initializing fresh in-memory db.');
        rawDb = new sqlInstance.Database();
      }
    } else {
      rawDb = new sqlInstance.Database();
    }
    initSchema();
    return db;
  },

  getRaw() {
    return rawDb;
  },

  exec(sql) {
    if (!rawDb) throw new Error('Database not initialized. Call db.init() first.');
    rawDb.exec(sql);
    saveDatabase();
  },

  prepare(sql) {
    if (!rawDb) throw new Error('Database not initialized. Call db.init() first.');

    return {
      all(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        if (args.length > 0) {
          stmt.bind(args);
        }
        return formatResults(stmt);
      },

      get(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        if (args.length > 0) {
          stmt.bind(args);
        }
        let result = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },

      run(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        if (args.length > 0) {
          stmt.bind(args);
        }
        stmt.step();
        stmt.free();

        const idRes = rawDb.exec('SELECT last_insert_rowid() AS id, changes() AS changes');
        let lastInsertRowid = 0;
        let changes = 0;
        if (idRes && idRes[0] && idRes[0].values && idRes[0].values[0]) {
          lastInsertRowid = idRes[0].values[0][0];
          changes = idRes[0].values[0][1];
        }

        saveDatabase();
        return { lastInsertRowid, changes };
      }
    };
  },

  transaction(fn) {
    return (...args) => {
      if (!rawDb) throw new Error('Database not initialized.');
      if (inTransaction) {
        // Nested transaction: execute directly
        return fn(...args);
      }

      inTransaction = true;
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        inTransaction = false;
        saveDatabase();
        return result;
      } catch (err) {
        try {
          rawDb.exec('ROLLBACK;');
        } catch (e) {
          // ignore rollback error
        }
        inTransaction = false;
        throw err;
      }
    };
  }
};

function initSchema() {
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      total_quantity INTEGER NOT NULL,
      available_quantity INTEGER NOT NULL,
      allocated_quantity INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      requested_quantity INTEGER NOT NULL,
      urgency TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      votes_count INTEGER NOT NULL DEFAULT 0,
      priority_score REAL NOT NULL DEFAULT 0,
      ranking_position INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      allocated_at DATETIME DEFAULT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      request_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, request_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(request_id) REFERENCES requests(id)
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      allocated_quantity INTEGER NOT NULL,
      allocated_by_user_id INTEGER NOT NULL,
      notes TEXT,
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(request_id) REFERENCES requests(id),
      FOREIGN KEY(resource_id) REFERENCES resources(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(allocated_by_user_id) REFERENCES users(id)
    );
  `);
  saveDatabase();
}

module.exports = db;
