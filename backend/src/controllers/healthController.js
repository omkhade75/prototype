import { db } from '../database/db.js';
import { AIService } from '../services/aiService.js';

export class HealthController {
  static async getSystemStatus(req, res, next) {
    try {
      // 1. Gather SQLite DB statistics
      const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
      const chunkCount = db.prepare('SELECT COUNT(*) as count FROM document_chunks').get().count;
      const workflowCount = db.prepare('SELECT COUNT(*) as count FROM workflow_definitions').get().count;
      const wfRunCount = db.prepare('SELECT COUNT(*) as count FROM workflow_runs').get().count;
      const agentRunCount = db.prepare('SELECT COUNT(*) as count FROM agent_runs').get().count;

      // 2. Check Python AI Service Health
      const aiHealth = await AIService.getHealth();

      res.json({
        success: true,
        data: {
          backend: {
            status: 'healthy',
            runtime: `Node.js ${process.version}`,
            uptime_seconds: Math.floor(process.uptime()),
            port: process.env.PORT || 5000
          },
          database: {
            engine: 'SQLite 3 (better-sqlite3)',
            mode: 'WAL',
            statistics: {
              documents: docCount,
              document_chunks: chunkCount,
              workflow_definitions: workflowCount,
              workflow_runs: wfRunCount,
              agent_runs: agentRunCount
            }
          },
          ai_service: aiHealth
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
