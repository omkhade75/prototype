import { db } from '../database/db.js';
import { AIService } from '../services/aiService.js';
import { EngineerService } from '../services/engineerService.js';

export class HealthController {
  static async getSystemStatus(req, res, next) {
    try {
      // 1. Gather SQLite DB statistics
      const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
      const chunkCount = db.prepare('SELECT COUNT(*) as count FROM document_chunks').get().count;
      const workflowCount = db.prepare('SELECT COUNT(*) as count FROM workflow_definitions').get().count;
      const wfRunCount = db.prepare('SELECT COUNT(*) as count FROM workflow_runs').get().count;
      const agentRunCount = db.prepare('SELECT COUNT(*) as count FROM agent_runs').get().count;
      const projectCount = db.prepare('SELECT COUNT(*) as count FROM engineer_projects').get()?.count || 0;
      const courseCount = db.prepare('SELECT COUNT(*) as count FROM course_materials').get()?.count || 0;
      const activeModelRow = db.prepare("SELECT value FROM app_settings WHERE key = 'active_model'").get();
      const dockerStatus = EngineerService.checkDocker();

      // 2. Check Python AI Service Health
      const aiHealth = await AIService.getHealth();

      res.json({
        success: true,
        data: {
          backend: {
            status: 'healthy',
            runtime: `Node.js ${process.version}`,
            uptime_seconds: Math.floor(process.uptime()),
            port: process.env.PORT || 5000,
            active_model: activeModelRow ? activeModelRow.value : 'llama3',
            docker_available: dockerStatus.available
          },
          database: {
            engine: 'SQLite 3 (better-sqlite3)',
            mode: 'WAL',
            statistics: {
              documents: docCount,
              document_chunks: chunkCount,
              workflow_definitions: workflowCount,
              workflow_runs: wfRunCount,
              agent_runs: agentRunCount,
              engineer_projects: projectCount,
              course_materials: courseCount
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
