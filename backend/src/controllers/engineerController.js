import { EngineerService } from '../services/engineerService.js';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class EngineerController {
  // --- Projects ---

  static async listProjects(req, res) {
    try {
      const projects = EngineerService.listProjects();
      res.json({ success: true, projects });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProject(req, res) {
    try {
      const project = EngineerService.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found.' });
      }
      res.json({ success: true, project });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createProject(req, res) {
    try {
      const { name, description, stack } = req.body;
      const project = EngineerService.createProject({ name, description, stack });
      res.status(201).json({ success: true, project });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const project = EngineerService.updateProject(req.params.id, req.body);
      res.json({ success: true, project });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      const ok = EngineerService.deleteProject(req.params.id);
      res.json({ success: ok });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Tasks ---

  static async listTasks(req, res) {
    try {
      const tasks = EngineerService.listTasks(req.params.id);
      res.json({ success: true, tasks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createTask(req, res) {
    try {
      const taskId = EngineerService.createTask(req.params.id, req.body);
      res.status(201).json({ success: true, task_id: taskId });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async updateTask(req, res) {
    try {
      EngineerService.updateTask(req.params.taskId, req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Files ---

  static async getFileTree(req, res) {
    try {
      const tree = EngineerService.getFileTree(req.params.id);
      res.json({ success: true, ...tree });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async readFile(req, res) {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        return res.status(400).json({ success: false, error: "Query parameter 'path' is required." });
      }
      const fileData = EngineerService.readFile(req.params.id, filePath);
      res.json({ success: true, file: fileData });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async writeFile(req, res) {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath) {
        return res.status(400).json({ success: false, error: "Field 'path' is required." });
      }
      const result = EngineerService.writeFile(req.params.id, filePath, content ?? '');
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async editFile(req, res) {
    try {
      const { path: filePath, target_content, replacement_content } = req.body;
      const result = EngineerService.editFile(req.params.id, filePath, target_content, replacement_content);
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Commands & Execution ---

  static async executeCommand(req, res) {
    try {
      const { command, args, confirmed, timeout_ms, allow_host_override } = req.body;
      const result = await EngineerService.executeCommand(req.params.id, {
        command,
        args,
        confirmed: Boolean(confirmed),
        timeoutMs: timeout_ms || 30000,
        allowHostOverride: Boolean(allow_host_override)
      });
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Git Operations ---

  static async getGitStatus(req, res) {
    try {
      const status = await EngineerService.getGitStatus(req.params.id);
      res.json({ success: true, git: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async previewCommit(req, res) {
    try {
      const preview = EngineerService.previewCommit(req.params.id);
      res.json({ success: true, screening: preview });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createCommit(req, res) {
    try {
      const { message, confirmed } = req.body;
      const result = await EngineerService.createCommit(req.params.id, message, Boolean(confirmed));
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async pushRepository(req, res) {
    try {
      const { remote, branch, confirmed } = req.body;
      const result = await EngineerService.pushRepository(req.params.id, remote, branch, Boolean(confirmed));
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- Preview Lifecycle ---

  static async startPreview(req, res) {
    try {
      const status = await EngineerService.startPreview(req.params.id);
      res.json({ success: true, preview: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async stopPreview(req, res) {
    try {
      const status = EngineerService.stopPreview(req.params.id);
      res.json({ success: true, preview: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPreviewStatus(req, res) {
    try {
      const status = EngineerService.getPreviewStatus(req.params.id);
      res.json({ success: true, preview: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- AI Agent Coordination (Proxy to Python AI Service) ---

  static async planProject(req, res) {
    try {
      const { prompt, stack, provider = 'demo', model } = req.body;
      const project = EngineerService.getProject(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      const aiRes = await fetch(`${AI_SERVICE_URL}/engineer/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: req.params.id,
          prompt: prompt || project.description,
          stack: stack || project.stack,
          provider,
          model
        })
      });

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.detail || `AI planning failed with HTTP ${aiRes.status}`);
      }

      const planData = await aiRes.json();

      // Store generated tasks into SQLite
      if (planData.tasks && Array.isArray(planData.tasks)) {
        for (let i = 0; i < planData.tasks.length; i++) {
          const t = planData.tasks[i];
          EngineerService.createTask(req.params.id, {
            title: t.title,
            description: t.description,
            category: t.category || 'scaffold',
            orderIndex: i
          });
        }
      }

      EngineerService.updateProject(req.params.id, {
        status: 'planning',
        summary_json: planData.architecture || {}
      });

      res.json({ success: true, plan: planData });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async generateProject(req, res) {
    try {
      const { provider = 'demo', model } = req.body;
      const project = EngineerService.getProject(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      const wsRoot = EngineerService.getWorkspaceRoot(req.params.id);

      const aiRes = await fetch(`${AI_SERVICE_URL}/engineer/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: req.params.id,
          workspace_root: wsRoot,
          prompt: project.description,
          stack: project.stack,
          provider,
          model
        })
      });

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.detail || `AI generation failed with HTTP ${aiRes.status}`);
      }

      const genData = await aiRes.json();

      // Update project status
      EngineerService.updateProject(req.params.id, {
        status: genData.success ? 'completed' : 'failed',
        summary_json: genData.summary || {}
      });

      // Mark tasks complete if successful
      if (genData.success && project.tasks) {
        for (const t of project.tasks) {
          EngineerService.updateTask(t.id, { status: 'completed' });
        }
      }

      res.json({ success: true, generation: genData });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async repairProject(req, res) {
    try {
      const { error_details, provider = 'demo', model } = req.body;
      const project = EngineerService.getProject(req.params.id);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });

      const wsRoot = EngineerService.getWorkspaceRoot(req.params.id);

      const aiRes = await fetch(`${AI_SERVICE_URL}/engineer/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: req.params.id,
          workspace_root: wsRoot,
          error_details,
          provider,
          model
        })
      });

      if (!aiRes.ok) {
        const errData = await aiRes.json().catch(() => ({}));
        throw new Error(errData.detail || `AI repair failed with HTTP ${aiRes.status}`);
      }

      const repairData = await aiRes.json();
      res.json({ success: true, repair: repairData });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
