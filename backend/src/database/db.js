import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'orbit_ai.db');

class NodeSqliteAdapter {
  constructor(databasePath) {
    this.rawDb = null;
  }

  async init(databasePath) {
    const { DatabaseSync } = await import('node:sqlite');
    this.rawDb = new DatabaseSync(databasePath);
  }

  exec(sql) {
    return this.rawDb.exec(sql);
  }

  pragma(sql) {
    try {
      return this.rawDb.exec(`PRAGMA ${sql}`);
    } catch {
      // pragma executed or ignored
    }
  }

  transaction(fn) {
    return (...args) => {
      this.rawDb.exec('BEGIN');
      try {
        const res = fn(...args);
        this.rawDb.exec('COMMIT');
        return res;
      } catch (err) {
        this.rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  }

  prepare(sql) {
    const rawStmt = this.rawDb.prepare(sql);
    const sanitize = (params) => {
      if (params.length === 1 && Array.isArray(params[0])) {
        return params[0].map(p => p === undefined ? null : p);
      }
      return params.map(p => p === undefined ? null : p);
    };

    return {
      run: (...params) => rawStmt.run(...sanitize(params)),
      get: (...params) => rawStmt.get(...sanitize(params)),
      all: (...params) => rawStmt.all(...sanitize(params)),
      iterate: (...params) => rawStmt.iterate(...sanitize(params))
    };
  }
}

let databaseInstance;

try {
  const { default: BetterSqlite } = await import('better-sqlite3');
  databaseInstance = new BetterSqlite(dbPath);
} catch (err) {
  const { DatabaseSync } = await import('node:sqlite');
  class BuiltinSqliteAdapter {
    constructor(filePath) {
      this.rawDb = new DatabaseSync(filePath);
    }

    exec(sql) {
      return this.rawDb.exec(sql);
    }

    pragma(sql) {
      try {
        return this.rawDb.exec(`PRAGMA ${sql}`);
      } catch {
        // pragma executed or ignored
      }
    }

    transaction(fn) {
      return (...args) => {
        this.rawDb.exec('BEGIN');
        try {
          const res = fn(...args);
          this.rawDb.exec('COMMIT');
          return res;
        } catch (err) {
          this.rawDb.exec('ROLLBACK');
          throw err;
        }
      };
    }

    prepare(sql) {
      const rawStmt = this.rawDb.prepare(sql);
      const sanitize = (params) => {
        if (params.length === 1 && Array.isArray(params[0])) {
          return params[0].map(p => p === undefined ? null : p);
        }
        return params.map(p => p === undefined ? null : p);
      };

      return {
        run: (...params) => rawStmt.run(...sanitize(params)),
        get: (...params) => rawStmt.get(...sanitize(params)),
        all: (...params) => rawStmt.all(...sanitize(params)),
        iterate: (...params) => rawStmt.iterate(...sanitize(params))
      };
    }
  }

  databaseInstance = new BuiltinSqliteAdapter(dbPath);
}

// Initialize database with WAL mode for concurrent read/write stability
export const db = databaseInstance;
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export default db;
