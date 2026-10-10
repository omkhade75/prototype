import express from 'express';
import cors from 'cors';
import { initializeSchema } from './database/schema.js';
import { seedDatabase } from './database/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import healthRoutes from './routes/healthRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import runRoutes from './routes/runRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import engineerRoutes from './routes/engineerRoutes.js';

export function createApp() {
  const app = express();

  // 1. Initialize SQLite Schema & Seed Data
  initializeSchema();
  seedDatabase();

  // 2. Middlewares
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // 3. API Routes
  app.use('/api', healthRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/agent', agentRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/runs', runRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/coding', codingRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/engineer', engineerRoutes);

  // 4. Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
