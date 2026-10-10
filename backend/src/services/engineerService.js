import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import net from 'net';
import { fileURLToPath } from 'url';
import { db } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Designated root for all generated projects (anchored to root workspaces folder)
const DEFAULT_WORKSPACES_DIR = path.resolve(__dirname, '../../../workspaces');
const WORKSPACES_DIR = process.env.WORKSPACES_DIR || DEFAULT_WORKSPACES_DIR;

// Ensure base workspaces directory exists
if (!fs.existsSync(WORKSPACES_DIR)) {
  fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
}

// In-memory active preview processes map: projectId -> { process, port, logs, url, status }
const activePreviews = new Map();

// Command execution allowlist
const ALLOWED_COMMANDS = new Set(['npm', 'node', 'npx', 'git', 'python', 'pytest']);

// Sensitive secret patterns for git pre-commit screening
const SECRET_PATTERNS = [
  /\bAIza[0-9A-Za-z-_]{35}\b/, // Google API key
  /\bsk-[a-zA-Z0-9]{20,}\b/,    // OpenAI key
  /\bghp_[a-zA-Z0-9]{36}\b/,    // GitHub token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
  /secret\s*[:=]\s*['"][^'"]+['"]/i
];

export class EngineerService {
  /**
   * Resolves and verifies canonical workspace root for a given project.
   */
  static getWorkspaceRoot(projectId) {
    const project = this.getProjectRecord(projectId);
    if (!project) {
      throw new Error(`Project '${projectId}' does not exist.`);
    }

    const wsPath = path.resolve(WORKSPACES_DIR, project.workspace_path || projectId);
    // Security check: ensure wsPath is strictly inside WORKSPACES_DIR
    if (!wsPath.startsWith(WORKSPACES_DIR)) {
      throw new Error(`Security Violation: Workspace path '${wsPath}' escapes designated workspaces root.`);
    }

    if (!fs.existsSync(wsPath)) {
      fs.mkdirSync(wsPath, { recursive: true });
    }

    return wsPath;
  }

  /**
   * Canonicalizes and safely resolves a relative path within project workspace.
   * Throws if path traversal attempts to escape the project directory.
   */
  static resolveSafePath(projectId, relativePath) {
    const root = this.getWorkspaceRoot(projectId);
    if (!relativePath || typeof relativePath !== 'string') {
      throw new Error("Invalid relative path.");
    }
    if (path.isAbsolute(relativePath) || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
      throw new Error(`Security Violation: Absolute paths outside project workspace are strictly denied: '${relativePath}'`);
    }
    const resolved = path.resolve(root, relativePath);

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error(`Security Violation: Path traversal outside project workspace is strictly denied: '${relativePath}'`);
    }

    return resolved;
  }

  // --- Project Management ---

  static listProjects() {
    const stmt = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM engineer_tasks t WHERE t.project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM engineer_tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM engineer_projects p
      ORDER BY p.updated_at DESC
    `);
    const projects = stmt.all();

    // Attach runtime preview status
    return projects.map((p) => {
      const runtime = activePreviews.get(p.id);
      return {
        ...p,
        preview_status: runtime ? runtime.status : (p.preview_status || 'stopped'),
        preview_url: runtime ? runtime.url : p.preview_url,
        summary: p.summary_json ? JSON.parse(p.summary_json) : {}
      };
    });
  }

  static getProjectRecord(projectId) {
    const stmt = db.prepare('SELECT * FROM engineer_projects WHERE id = ?');
    return stmt.get(projectId);
  }

  static getProject(projectId) {
    const project = this.getProjectRecord(projectId);
    if (!project) {
      return null;
    }

    const tasksStmt = db.prepare('SELECT * FROM engineer_tasks WHERE project_id = ? ORDER BY order_index ASC');
    const tasks = tasksStmt.all(projectId).map((t) => ({
      ...t,
      files_affected: t.files_affected ? JSON.parse(t.files_affected) : [],
      commands_run: t.commands_run ? JSON.parse(t.commands_run) : []
    }));

    const activitiesStmt = db.prepare('SELECT * FROM engineer_activities WHERE project_id = ? ORDER BY id DESC LIMIT 100');
    const activities = activitiesStmt.all(projectId).map((a) => ({
      ...a,
      details: a.details_json ? JSON.parse(a.details_json) : {}
    }));

    const runtime = activePreviews.get(projectId);

    return {
      ...project,
      preview_status: runtime ? runtime.status : (project.preview_status || 'stopped'),
      preview_url: runtime ? runtime.url : project.preview_url,
      summary: project.summary_json ? JSON.parse(project.summary_json) : {},
      tasks,
      activities
    };
  }

  static createProject({ name, description, stack = 'react-express-sqlite' }) {
    if (!name || !name.trim()) {
      throw new Error('Project name cannot be empty.');
    }
    if (!description || !description.trim()) {
      throw new Error('Project description / prompt cannot be empty.');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const workspacePath = `${slug}-${id.substring(id.lastIndexOf('_') + 1)}`;
    const fullWs = path.resolve(WORKSPACES_DIR, workspacePath);

    fs.mkdirSync(fullWs, { recursive: true });

    // Initialize default .gitignore
    const gitignorePath = path.join(fullWs, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, "node_modules/\n.env\n*.db\n*.log\ndist/\nbuild/\n.DS_Store\n", 'utf8');
    }

    const stmt = db.prepare(`
      INSERT INTO engineer_projects (
        id, name, description, workspace_path, stack, status, preview_port, preview_status
      ) VALUES (?, ?, ?, ?, ?, 'created', 5173, 'stopped')
    `);
    stmt.run(id, name.trim(), description.trim(), workspacePath, stack);

    this.logActivity(id, {
      activityType: 'plan',
      description: `Project initialized: ${name} (${stack})`,
      details: { workspacePath }
    });

    return this.getProject(id);
  }

  static updateProject(projectId, updates = {}) {
    const allowed = ['name', 'description', 'status', 'preview_port', 'preview_pid', 'preview_status', 'preview_url', 'git_status', 'summary_json'];
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }

    if (fields.length === 0) return this.getProject(projectId);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(projectId);

    const sql = `UPDATE engineer_projects SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return this.getProject(projectId);
  }

  static deleteProject(projectId, { deleteFiles = false } = {}) {
    // Stop any active preview first
    this.stopPreview(projectId);

    const project = this.getProjectRecord(projectId);
    if (!project) return false;

    // Optionally clean up workspace directory from disk
    if (deleteFiles && project.workspace_path) {
      try {
        const wsRoot = path.resolve(WORKSPACES_DIR, project.workspace_path);
        if (wsRoot.startsWith(WORKSPACES_DIR) && fs.existsSync(wsRoot)) {
          fs.rmSync(wsRoot, { recursive: true, force: true });
        }
      } catch (err) {
        // Log warning but continue with database deletion
        console.warn(`Could not remove workspace files for ${projectId}:`, err.message);
      }
    }

    // Delete database records
    db.prepare('DELETE FROM engineer_activities WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM engineer_tasks WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM engineer_projects WHERE id = ?').run(projectId);

    return true;
  }

  // --- Task Management ---

  static listTasks(projectId) {
    const stmt = db.prepare('SELECT * FROM engineer_tasks WHERE project_id = ? ORDER BY order_index ASC');
    return stmt.all(projectId).map((t) => ({
      ...t,
      files_affected: t.files_affected ? JSON.parse(t.files_affected) : [],
      commands_run: t.commands_run ? JSON.parse(t.commands_run) : []
    }));
  }

  static createTask(projectId, { title, description = '', category = 'scaffold', orderIndex = 0 }) {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO engineer_tasks (
        id, project_id, title, description, category, status, order_index
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `);
    stmt.run(id, projectId, title, description, category, orderIndex);
    return id;
  }

  static updateTask(taskId, updates = {}) {
    const allowed = ['title', 'description', 'status', 'files_affected', 'commands_run', 'error_details'];
    const fields = [];
    const values = [];

    for (const [key, val] of Object.entries(updates)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }

    if (fields.length === 0) return;
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(taskId);

    db.prepare(`UPDATE engineer_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // --- Activity Logging ---

  static logActivity(projectId, {
    taskId = null,
    activityType = 'info',
    description = '',
    command = null,
    exitCode = null,
    stdout = null,
    stderr = null,
    durationMs = 0,
    details = {}
  }) {
    const stmt = db.prepare(`
      INSERT INTO engineer_activities (
        project_id, task_id, activity_type, description, command, exit_code, stdout, stderr, duration_ms, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      projectId,
      taskId,
      activityType,
      description,
      command,
      exitCode,
      stdout,
      stderr,
      durationMs,
      JSON.stringify(details || {})
    );
  }

  // --- File Explorer & Safe File Operations ---

  static getFileTree(projectId) {
    const root = this.getWorkspaceRoot(projectId);

    const buildTree = (dirPath, relBase = '') => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const items = [];

      for (const ent of entries) {
        // Skip noise and heavy dirs
        if (['node_modules', '.git', 'dist', 'build', '.cache', '__pycache__'].includes(ent.name)) {
          continue;
        }

        const fullPath = path.join(dirPath, ent.name);
        const relPath = path.join(relBase, ent.name).replace(/\\/g, '/');

        if (ent.isDirectory()) {
          items.push({
            name: ent.name,
            path: relPath,
            type: 'directory',
            children: buildTree(fullPath, relPath)
          });
        } else {
          const stats = fs.statSync(fullPath);
          items.push({
            name: ent.name,
            path: relPath,
            type: 'file',
            size: stats.size,
            updated_at: stats.mtime
          });
        }
      }

      // Sort directories first, then alphabetical
      return items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    };

    return {
      root_name: path.basename(root),
      tree: buildTree(root)
    };
  }

  static readFile(projectId, relativePath) {
    const safePath = this.resolveSafePath(projectId, relativePath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File '${relativePath}' does not exist in workspace.`);
    }
    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      throw new Error(`'${relativePath}' is a directory, not a file.`);
    }

    const content = fs.readFileSync(safePath, 'utf8');
    return {
      path: relativePath.replace(/\\/g, '/'),
      content,
      size: stat.size,
      updated_at: stat.mtime
    };
  }

  static writeFile(projectId, relativePath, content) {
    const safePath = this.resolveSafePath(projectId, relativePath);
    const dir = path.dirname(safePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(safePath, content, 'utf8');
    const stat = fs.statSync(safePath);

    this.logActivity(projectId, {
      activityType: 'file_edit',
      description: `Wrote file '${relativePath}' (${stat.size} bytes)`
    });

    return {
      path: relativePath.replace(/\\/g, '/'),
      size: stat.size,
      updated_at: stat.mtime
    };
  }

  static editFile(projectId, relativePath, targetContent, replacementContent) {
    const safePath = this.resolveSafePath(projectId, relativePath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File '${relativePath}' not found.`);
    }

    const current = fs.readFileSync(safePath, 'utf8');
    if (!current.includes(targetContent)) {
      throw new Error(`Target content block not found in '${relativePath}'.`);
    }

    const updated = current.replace(targetContent, replacementContent);
    fs.writeFileSync(safePath, updated, 'utf8');

    this.logActivity(projectId, {
      activityType: 'file_edit',
      description: `Modified file '${relativePath}'`
    });

    return {
      path: relativePath.replace(/\\/g, '/'),
      success: true
    };
  }

  // --- Safe Command Execution ---

  static checkDocker() {
    try {
      execSync('docker --version', { stdio: 'ignore', timeout: 2000 });
      return { available: true };
    } catch {
      return {
        available: false,
        actionable_setup:
          '1. Install Docker Desktop from https://www.docker.com/products/docker-desktop\n' +
          '2. Start Docker Desktop and verify the daemon is running.\n' +
          '3. For local trusted testing without Docker, pass allowHostOverride: true (warning: runs directly on host).'
      };
    }
  }

  static async executeCommand(projectId, {
    command,
    args = [],
    confirmed = false,
    timeoutMs = 30000,
    allowHostOverride = false
  }) {
    if (!ALLOWED_COMMANDS.has(command)) {
      throw new Error(`Command '${command}' is not in the development allowlist. Allowed: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);
    }

    // Require explicit confirmation for dependency install or destructive operations
    const isInstallOrDestructive = (command === 'npm' && args.includes('install')) ||
                                   (command === 'git' && (args.includes('clean') || args.includes('reset')));
    if (isInstallOrDestructive && !confirmed) {
      return {
        requires_approval: true,
        command: `${command} ${args.join(' ')}`,
        message: `Command '${command} ${args.join(' ')}' requires explicit student confirmation.`
      };
    }

    const ws = this.getWorkspaceRoot(projectId);
    const start = Date.now();

    // Check container isolation requirement for untrusted execution
    const isUntrustedCodeExecution = ['node', 'npm', 'npx', 'python', 'pytest'].includes(command);
    const dockerStatus = this.checkDocker();

    if (isUntrustedCodeExecution && !dockerStatus.available && !allowHostOverride) {
      const refusalResult = {
        command: `${command} ${args.join(' ')}`,
        exit_code: -1,
        stdout: '',
        stderr:
          'Execution Refused: Docker container isolation is required to safely run untrusted project code.\n' +
          'Direct host execution of arbitrary project code is disabled by security policy.\n' +
          dockerStatus.actionable_setup,
        duration_ms: 0,
        timed_out: false,
        success: false,
        docker_available: false,
        isolated: false,
        actionable_setup: dockerStatus.actionable_setup
      };

      EngineerService.logActivity(projectId, {
        activityType: 'command',
        description: `Refused (unisolated): ${command} ${args.join(' ')}`,
        command: `${command} ${args.join(' ')}`,
        exitCode: -1,
        stderr: refusalResult.stderr.substring(0, 500),
        durationMs: 0
      });

      return refusalResult;
    }

    // Decide execution command & args (Docker container vs Host)
    let execCmd = command;
    let execArgs = args;
    let isContainerized = false;
    let hostWarning = null;

    if (isUntrustedCodeExecution && dockerStatus.available) {
      isContainerized = true;
      execCmd = 'docker';
      execArgs = [
        'run', '--rm',
        '--network=none',
        '-m', '512m',
        '--cpus', '1.0',
        '--pids-limit', '64',
        '--cap-drop=ALL',
        '-v', `${ws}:/workspace`,
        '-w', '/workspace',
        'node:20-alpine',
        command,
        ...args
      ];
    } else if (isUntrustedCodeExecution && allowHostOverride) {
      hostWarning = 'Execution ran directly on host machine without container isolation via development override.';
    }

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Safe argument execution array
      const proc = spawn(execCmd, execArgs, {
        cwd: ws,
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          CI: 'true',
          NODE_ENV: 'test'
        }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          proc.kill('SIGTERM');
        } catch {
          // ignore
        }
      }, timeoutMs);

      proc.stdout?.on('data', (d) => {
        stdout += d.toString();
        if (stdout.length > 50000) stdout = stdout.substring(stdout.length - 50000); // cap output
      });

      proc.stderr?.on('data', (d) => {
        stderr += d.toString();
        if (stderr.length > 50000) stderr = stderr.substring(stderr.length - 50000);
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const duration = Date.now() - start;

        const result = {
          command: `${command} ${args.join(' ')}`,
          exit_code: timedOut ? -1 : (code ?? 0),
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration_ms: duration,
          timed_out: timedOut,
          success: !timedOut && code === 0,
          isolated: isContainerized,
          docker_available: dockerStatus.available,
          warning: hostWarning
        };

        EngineerService.logActivity(projectId, {
          activityType: 'command',
          description: `Ran: ${command} ${args.join(' ')}`,
          command: `${command} ${args.join(' ')}`,
          exitCode: result.exit_code,
          stdout: result.stdout.substring(0, 500),
          stderr: result.stderr.substring(0, 500),
          durationMs: duration,
          details: { timedOut, isolated: isContainerized, warning: hostWarning }
        });

        resolve(result);
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        const duration = Date.now() - start;

        const result = {
          command: `${command} ${args.join(' ')}`,
          exit_code: -1,
          stdout: stdout.trim(),
          stderr: `Spawn error: ${err.message}`,
          duration_ms: duration,
          timed_out: false,
          success: false
        };

        EngineerService.logActivity(projectId, {
          activityType: 'command',
          description: `Failed to spawn: ${command} ${args.join(' ')}`,
          command: `${command} ${args.join(' ')}`,
          exitCode: -1,
          stderr: err.message,
          durationMs: duration
        });

        resolve(result);
      });
    });
  }

  // --- Git Operations & Secret Exclusion ---

  static async getGitStatus(projectId) {
    const statusRes = await this.executeCommand(projectId, { command: 'git', args: ['status', '--porcelain', '-b'] });
    const diffRes = await this.executeCommand(projectId, { command: 'git', args: ['diff', '--stat'] });

    return {
      success: statusRes.success,
      branch_summary: statusRes.stdout.split('\n')[0] || '## main',
      porcelain: statusRes.stdout,
      diff_stat: diffRes.stdout
    };
  }

  static previewCommit(projectId) {
    const root = this.getWorkspaceRoot(projectId);
    const violations = [];
    const cleanFiles = [];

    const scanDir = (dirPath, relBase = '') => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (['node_modules', '.git', 'dist', 'build'].includes(item.name)) continue;

        const fullPath = path.join(dirPath, item.name);
        const rel = path.join(relBase, item.name).replace(/\\/g, '/');

        if (item.isDirectory()) {
          scanDir(fullPath, rel);
        } else {
          // Check secret filename rules
          if (item.name.startsWith('.env') || item.name.endsWith('.db') || item.name.endsWith('.sqlite')) {
            violations.push({
              file: rel,
              reason: 'Environment credentials or database file must never be committed.'
            });
            continue;
          }

          // Scan content for secrets if file is text and < 1MB
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size < 1000000) {
              const text = fs.readFileSync(fullPath, 'utf8');
              let foundSecret = false;
              for (const pattern of SECRET_PATTERNS) {
                if (pattern.test(text)) {
                  violations.push({
                    file: rel,
                    reason: 'Potential API key, private key or credential found in file content.'
                  });
                  foundSecret = true;
                  break;
                }
              }
              if (!foundSecret) {
                cleanFiles.push(rel);
              }
            } else {
              cleanFiles.push(rel);
            }
          } catch {
            cleanFiles.push(rel);
          }
        }
      }
    };

    scanDir(root);

    return {
      ready_for_commit: violations.length === 0,
      violations,
      clean_files: cleanFiles,
      message: violations.length > 0
        ? `Secret screening detected ${violations.length} protected file(s). Exclude them from commit.`
        : 'All files passed security screening. Safe to commit.'
    };
  }

  static async createCommit(projectId, message, confirmed = false) {
    if (!confirmed) {
      return {
        requires_approval: true,
        message: 'Creating a Git commit requires explicit student confirmation.'
      };
    }

    if (!message || !message.trim()) {
      throw new Error('Commit message cannot be empty.');
    }

    // Check pre-commit screening
    const screening = this.previewCommit(projectId);
    if (!screening.ready_for_commit) {
      throw new Error(`Commit blocked by secret screening: ${screening.violations.map((v) => v.file).join(', ')}`);
    }

    // Add safe files
    await this.executeCommand(projectId, { command: 'git', args: ['add', '.'] });
    const commitRes = await this.executeCommand(projectId, {
      command: 'git',
      args: ['commit', '-m', message.trim()],
      confirmed: true
    });

    this.logActivity(projectId, {
      activityType: 'git',
      description: `Committed changes: "${message.trim()}"`,
      exitCode: commitRes.exit_code,
      stdout: commitRes.stdout
    });

    return commitRes;
  }

  static async pushRepository(projectId, remote = 'origin', branch = 'main', confirmed = false) {
    if (!confirmed) {
      return {
        requires_approval: true,
        message: `Pushing to remote repository '${remote}/${branch}' requires explicit student confirmation.`
      };
    }

    // Safety: ensure this is NOT ORBIT's own repository
    const ws = this.getWorkspaceRoot(projectId);
    if (ws === process.cwd()) {
      throw new Error('Critical Security Guard: Pushing ORBIT codebase itself is strictly forbidden.');
    }

    const pushRes = await this.executeCommand(projectId, {
      command: 'git',
      args: ['push', remote, branch],
      confirmed: true
    });

    return pushRes;
  }

  // --- Local Preview Lifecycle ---

  static async findFreePort(startPort = 5173) {
    const isPortAvailable = (port) => new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true));
      });
    });

    let port = startPort;
    while (port < startPort + 50) {
      if (await isPortAvailable(port)) {
        return port;
      }
      port++;
    }
    return startPort;
  }

  static async startPreview(projectId) {
    const project = this.getProject(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found.`);

    // If already running, return existing state
    if (activePreviews.has(projectId)) {
      const existing = activePreviews.get(projectId);
      if (existing.status === 'running') {
        return {
          status: 'running',
          url: existing.url,
          port: existing.port,
          logs: existing.logs.slice(-30)
        };
      }
    }

    const ws = this.getWorkspaceRoot(projectId);
    const port = await this.findFreePort(project.preview_port || 5173);

    const previewState = {
      process: null,
      port,
      url: `http://localhost:${port}`,
      logs: [],
      status: 'starting'
    };
    activePreviews.set(projectId, previewState);

    // Determine dev script from package.json if present
    let runCommand = 'npm';
    let runArgs = ['run', 'dev', '--', '--port', String(port)];

    const pkgPath = path.join(ws, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts?.start && !pkg.scripts?.dev) {
          runArgs = ['start'];
        }
      } catch {
        // ignore
      }
    } else {
      // Fallback: check if server.js exists
      if (fs.existsSync(path.join(ws, 'server.js'))) {
        runCommand = 'node';
        runArgs = ['server.js'];
      }
    }

    // Spawn server process safely
    const child = spawn(runCommand, runArgs, {
      cwd: ws,
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
        PORT: String(port)
      }
    });

    previewState.process = child;

    const addLog = (line) => {
      previewState.logs.push(`[${new Date().toLocaleTimeString()}] ${line}`);
      if (previewState.logs.length > 500) previewState.logs.shift();
    };

    addLog(`Spawned preview server on port ${port} (${runCommand} ${runArgs.join(' ')})`);

    child.stdout?.on('data', (d) => {
      const msg = d.toString().trim();
      addLog(msg);
      // Check for readiness indicators
      if (msg.includes('http://') || msg.includes('localhost') || msg.includes('ready') || msg.includes('running')) {
        previewState.status = 'running';
        EngineerService.updateProject(projectId, {
          preview_status: 'running',
          preview_port: port,
          preview_pid: child.pid,
          preview_url: previewState.url
        });
      }
    });

    child.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      addLog(`[STDERR] ${msg}`);
    });

    child.on('close', (code) => {
      addLog(`Server exited with code ${code}`);
      previewState.status = 'stopped';
      activePreviews.delete(projectId);
      EngineerService.updateProject(projectId, {
        preview_status: 'stopped',
        preview_pid: null
      });
    });

    child.on('error', (err) => {
      addLog(`Failed to start preview server: ${err.message}`);
      previewState.status = 'error';
      EngineerService.updateProject(projectId, {
        preview_status: 'error',
        preview_pid: null
      });
    });

    // Mark running after initial grace period if process hasn't exited
    setTimeout(() => {
      if (previewState.status === 'starting' && previewState.process && !previewState.process.killed) {
        previewState.status = 'running';
        EngineerService.updateProject(projectId, {
          preview_status: 'running',
          preview_port: port,
          preview_pid: child.pid,
          preview_url: previewState.url
        });
      }
    }, 2500);

    return {
      status: previewState.status,
      url: previewState.url,
      port,
      logs: previewState.logs
    };
  }

  static stopPreview(projectId) {
    const existing = activePreviews.get(projectId);
    if (!existing || !existing.process) {
      this.updateProject(projectId, { preview_status: 'stopped', preview_pid: null });
      return { status: 'stopped' };
    }

    try {
      existing.process.kill('SIGTERM');
      setTimeout(() => {
        if (!existing.process.killed) {
          try { existing.process.kill('SIGKILL'); } catch { /* ignore */ }
        }
      }, 1000);
    } catch {
      // ignore
    }

    activePreviews.delete(projectId);
    this.updateProject(projectId, { preview_status: 'stopped', preview_pid: null });

    return { status: 'stopped' };
  }

  static getPreviewStatus(projectId) {
    const existing = activePreviews.get(projectId);
    const project = this.getProjectRecord(projectId);

    if (!existing) {
      return {
        status: project?.preview_status || 'stopped',
        url: project?.preview_url || null,
        port: project?.preview_port || 5173,
        logs: []
      };
    }

    return {
      status: existing.status,
      url: existing.url,
      port: existing.port,
      logs: existing.logs.slice(-50)
    };
  }
}
