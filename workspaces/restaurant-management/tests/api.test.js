import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { db, sqlite } from '../database.js';

test('Restaurant Management Genuine SQLite Database & API Suite', async (t) => {
  await t.test('verifies real SQLite .db binary file exists on disk with SQLite header', () => {
    assert.ok(fs.existsSync(db.dbPath), `Database file must exist at ${db.dbPath}`);
    const buffer = fs.readFileSync(db.dbPath);
    assert.ok(buffer.length >= 16, 'Database file must have at least 16 bytes');
    const header = buffer.toString('utf8', 0, 15);
    assert.strictEqual(header, 'SQLite format 3', 'Database file header must verify real SQLite format 3 binary format');
  });

  await t.test('database initializes with seeded menu items via real SQL query', () => {
    const items = db.getAll('menu_items');
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 4, 'Must have at least 4 seeded menu items in SQLite table');
    assert.strictEqual(items[0].name, 'Truffle Pasta');
    assert.strictEqual(items[0].category, 'Mains');
    assert.strictEqual(items[0].price, 24.50);
  });

  await t.test('database insert and retrieval works correctly using real SQL statements', () => {
    const created = db.insert('menu_items', {
      name: 'Espresso Romano',
      category: 'Beverages',
      price: 4.25,
      status: 'available'
    });
    assert.ok(created.id > 0, 'New row must have an auto-increment primary key ID');
    assert.strictEqual(created.name, 'Espresso Romano');

    // Retrieve via raw SQL statement
    const row = sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(created.id);
    assert.ok(row, 'Inserted row must be queryable via prepared SQL statement');
    assert.strictEqual(row.name, 'Espresso Romano');
    assert.strictEqual(row.price, 4.25);

    // Clean up via SQL DELETE
    const deleted = db.delete('menu_items', created.id);
    assert.strictEqual(deleted, true);

    const check = sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(created.id);
    assert.strictEqual(check, undefined, 'Deleted row must no longer exist in SQLite table');
  });

  await t.test('orders and tables calculate statistics accurately via SQL aggregate functions', () => {
    const orders = db.getAll('orders');
    const tables = db.getAll('tables');
    assert.ok(orders.length >= 2, 'Must have seeded orders');
    assert.ok(tables.length >= 5, 'Must have seeded tables');

    // Calculate sum via raw SQL aggregate query
    const sumRow = sqlite.prepare('SELECT SUM(total) as revenue, COUNT(*) as count FROM orders').get();
    assert.ok(sumRow.revenue > 0);
    assert.strictEqual(sumRow.count, orders.length);
  });
});
