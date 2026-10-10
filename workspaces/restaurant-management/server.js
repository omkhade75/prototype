import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Analytics & Stats summary
app.get('/api/stats', (req, res) => {
  const orders = db.getAll('orders');
  const menuItems = db.getAll('menu_items');
  const tables = db.getAll('tables');
  const inventory = db.getAll('inventory');

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const lowStock = inventory.filter((i) => i.quantity <= i.threshold).length;

  res.json({
    total_orders: orders.length,
    total_revenue: totalRevenue,
    menu_items_count: menuItems.length,
    occupied_tables: occupiedTables,
    total_tables: tables.length,
    low_stock_alerts: lowStock
  });
});

// Menu Items CRUD
app.get('/api/menu_items', (req, res) => {
  res.json(db.getAll('menu_items'));
});

app.post('/api/menu_items', (req, res) => {
  const { name, category, price, status } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }
  const item = db.insert('menu_items', {
    name,
    category: category || 'Mains',
    price: Number(price),
    status: status || 'available'
  });
  res.status(201).json(item);
});

app.delete('/api/menu_items/:id', (req, res) => {
  const deleted = db.delete('menu_items', req.params.id);
  res.json({ success: deleted });
});

// Orders
app.get('/api/orders', (req, res) => {
  res.json(db.getAll('orders'));
});

app.post('/api/orders', (req, res) => {
  const { table_number, customer, total } = req.body;
  const order = db.insert('orders', {
    table_number: Number(table_number) || 1,
    customer: customer || 'Guest',
    total: Number(total) || 0,
    status: 'in_prep',
    created_at: new Date().toISOString()
  });
  res.status(201).json(order);
});

// Tables
app.get('/api/tables', (req, res) => {
  res.json(db.getAll('tables'));
});

// Inventory
app.get('/api/inventory', (req, res) => {
  res.json(db.getAll('inventory'));
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ORBIT App Server] Running on http://localhost:${PORT}`);
});

export default app;
