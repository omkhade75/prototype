import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'restaurant.db');

// Universal SQLite Engine: node:sqlite (native in Node 22+) or better-sqlite3
let DatabaseSync;
try {
  const mod = await import('node:sqlite');
  DatabaseSync = mod.DatabaseSync;
} catch {
  const mod = await import('better-sqlite3');
  DatabaseSync = mod.default;
}

export const sqlite = new DatabaseSync(DB_FILE);

// Initialize real SQLite tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL,
    customer TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'in_prep',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT UNIQUE NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    threshold REAL NOT NULL
  );
`);

// Seed initial records if table is empty
const countCheck = sqlite.prepare("SELECT COUNT(*) as count FROM menu_items").get();
if (!countCheck || countCheck.count === 0) {
  const insertMenu = sqlite.prepare("INSERT INTO menu_items (name, category, price, status) VALUES (?, ?, ?, ?)");
  insertMenu.run('Truffle Pasta', 'Mains', 24.50, 'available');
  insertMenu.run('Margherita Pizza', 'Mains', 18.00, 'available');
  insertMenu.run('Caesar Salad', 'Starters', 12.00, 'available');
  insertMenu.run('Tiramisu', 'Desserts', 9.50, 'available');

  const insertOrder = sqlite.prepare("INSERT INTO orders (table_number, customer, total, status) VALUES (?, ?, ?, ?)");
  insertOrder.run(3, 'Alice', 42.50, 'served');
  insertOrder.run(5, 'Bob', 27.50, 'in_prep');

  const insertTable = sqlite.prepare("INSERT INTO tables (table_number, capacity, status) VALUES (?, ?, ?)");
  insertTable.run(1, 2, 'available');
  insertTable.run(2, 4, 'reserved');
  insertTable.run(3, 4, 'occupied');
  insertTable.run(4, 6, 'available');
  insertTable.run(5, 2, 'occupied');

  const insertInv = sqlite.prepare("INSERT INTO inventory (item_name, quantity, unit, threshold) VALUES (?, ?, ?, ?)");
  insertInv.run('Pasta Flour', 45, 'kg', 10);
  insertInv.run('Truffle Oil', 4, 'liters', 2);
  insertInv.run('Mozzarella', 18, 'kg', 5);
}

// Clean SQL DAO abstraction methods
export const db = {
  raw: sqlite,
  dbPath: DB_FILE,
  getAll(table) {
    return sqlite.prepare(`SELECT * FROM ${table} ORDER BY id ASC`).all();
  },
  getById(table, id) {
    return sqlite.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  },
  insert(table, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => data[k]);
    const stmt = sqlite.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
    const res = stmt.run(...values);
    return { id: Number(res.lastInsertRowid), ...data };
  },
  delete(table, id) {
    const stmt = sqlite.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const res = stmt.run(id);
    return res.changes > 0;
  }
};
