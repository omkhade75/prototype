import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[ORBIT AI] Node.js Express server running at http://localhost:${PORT}`);
  console.log(`[ORBIT AI] Connected to SQLite database with WAL mode.`);
  console.log(`[ORBIT AI] Proxying AI operations to Python service at ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
});
