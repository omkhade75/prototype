import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { createApp } from '../src/app.js';
import { EngineerService } from '../src/services/engineerService.js';

test('Software Engineer Backend Service & Sandboxed Workspace Suite', async (t) => {
  // Ensure database schema is initialized
  createApp();

  let testProjectId = null;

  await t.test('createProject initializes record and workspace directory', () => {
    const proj = EngineerService.createProject({
      name: 'Test Bakery Portal',
      description: 'Online bakery ordering and inventory management',
      stack: 'react-express-sqlite'
    });

    assert.ok(proj.id);
    assert.strictEqual(proj.name, 'Test Bakery Portal');
    assert.strictEqual(proj.stack, 'react-express-sqlite');
    assert.strictEqual(proj.status, 'created');

    testProjectId = proj.id;

    // Verify workspace directory was created on disk
    const wsRoot = EngineerService.getWorkspaceRoot(testProjectId);
    assert.ok(fs.existsSync(wsRoot));
    assert.ok(fs.existsSync(path.join(wsRoot, '.gitignore')));
  });

  await t.test('listProjects returns created project with task counts', () => {
    const projects = EngineerService.listProjects();
    assert.ok(Array.isArray(projects));
    const found = projects.find((p) => p.id === testProjectId);
    assert.ok(found);
    assert.strictEqual(found.name, 'Test Bakery Portal');
  });

  await t.test('tasks lifecycle: create, list, and update', () => {
    const taskId = EngineerService.createTask(testProjectId, {
      title: 'Setup SQLite Schema',
      description: 'Create pastry and order tables',
      category: 'database',
      orderIndex: 0
    });
    assert.ok(taskId);

    const tasks = EngineerService.listTasks(testProjectId);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'Setup SQLite Schema');
    assert.strictEqual(tasks[0].status, 'pending');

    // Update task
    EngineerService.updateTask(taskId, { status: 'completed' });
    const updatedTasks = EngineerService.listTasks(testProjectId);
    assert.strictEqual(updatedTasks[0].status, 'completed');
  });

  await t.test('safe file operations: write, read, edit, tree', () => {
    // Write
    const wRes = EngineerService.writeFile(testProjectId, 'src/pastries.js', "export const pastries = ['Croissant', 'Scone'];\n");
    assert.strictEqual(wRes.path, 'src/pastries.js');
    assert.ok(wRes.size > 0);

    // Read
    const rRes = EngineerService.readFile(testProjectId, 'src/pastries.js');
    assert.ok(rRes.content.includes('Croissant'));

    // Edit
    const eRes = EngineerService.editFile(testProjectId, 'src/pastries.js', "'Scone'", "'Baguette'");
    assert.ok(eRes.success);
    const rRes2 = EngineerService.readFile(testProjectId, 'src/pastries.js');
    assert.ok(rRes2.content.includes('Baguette'));
    assert.ok(!rRes2.content.includes('Scone'));

    // Tree
    const treeData = EngineerService.getFileTree(testProjectId);
    assert.ok(treeData.tree.length > 0);
  });

  await t.test('security: strictly denies path traversal outside workspace', () => {
    assert.throws(() => {
      EngineerService.resolveSafePath(testProjectId, '../../package.json');
    }, /Security Violation/);

    assert.throws(() => {
      EngineerService.resolveSafePath(testProjectId, '/etc/passwd');
    }, /Security Violation/);

    assert.throws(() => {
      EngineerService.readFile(testProjectId, '../../../.env');
    }, /Security Violation/);
  });

  await t.test('command execution: require confirmation for npm install', async () => {
    const unconfirmed = await EngineerService.executeCommand(testProjectId, {
      command: 'npm',
      args: ['install', 'lodash'],
      confirmed: false
    });
    assert.ok(unconfirmed.requires_approval);
    assert.ok(unconfirmed.message.includes('requires explicit student confirmation'));
  });

  await t.test('git screening detects and flags .env and database files', () => {
    // Write a .env file in workspace
    EngineerService.writeFile(testProjectId, '.env', 'DB_PASSWORD=secret123\n');

    const screening = EngineerService.previewCommit(testProjectId);
    assert.strictEqual(screening.ready_for_commit, false);
    assert.ok(screening.violations.some((v) => v.file.includes('.env')));
  });

  await t.test('preview commit and commit requires explicit confirmation', async () => {
    const res = await EngineerService.createCommit(testProjectId, 'Initial commit', false);
    assert.ok(res.requires_approval);
  });

  await t.test('container isolation: refuses unisolated execution without host override when Docker is absent', async () => {
    const dockerStatus = EngineerService.checkDocker();
    if (!dockerStatus.available) {
      const refused = await EngineerService.executeCommand(testProjectId, {
        command: 'node',
        args: ['-e', 'console.log("untrusted")'],
        allowHostOverride: false
      });
      assert.strictEqual(refused.success, false);
      assert.strictEqual(refused.exit_code, -1);
      assert.strictEqual(refused.docker_available, false);
      assert.ok(refused.stderr.includes('Execution Refused: Docker container isolation is required'));
      assert.ok(refused.actionable_setup.includes('Install Docker Desktop'));
    }
  });

  await t.test('host override: executes on host with explicit security warning', async () => {
    const executed = await EngineerService.executeCommand(testProjectId, {
      command: 'node',
      args: ['-e', 'console.log("host override active")'],
      allowHostOverride: true
    });
    assert.strictEqual(executed.success, true);
    assert.ok(executed.stdout.includes('host override active'));
    if (!executed.docker_available) {
      assert.ok(executed.warning.includes('without container isolation'));
    }
  });

  await t.test('genuine SQLite persistence: creates binary SQLite database format', async () => {
    let DatabaseSync;
    try {
      const mod = await import('node:sqlite');
      DatabaseSync = mod.DatabaseSync;
    } catch {
      const mod = await import('better-sqlite3');
      DatabaseSync = mod.default;
    }

    const wsRoot = EngineerService.getWorkspaceRoot(testProjectId);
    const dbPath = path.join(wsRoot, 'test_persistence.db');
    const sqlite = new DatabaseSync(dbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        amount REAL
      );
    `);
    sqlite.prepare('INSERT INTO test_orders (customer_name, amount) VALUES (?, ?)').run('Alice', 49.99);
    sqlite.close?.();

    assert.ok(fs.existsSync(dbPath));
    const fd = fs.openSync(dbPath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    assert.strictEqual(buf.toString('utf8'), 'SQLite format 3\0');
  });

  await t.test('deleteProject cleans up project record', () => {
    const deleted = EngineerService.deleteProject(testProjectId);
    assert.strictEqual(deleted, true);

    const check = EngineerService.getProject(testProjectId);
    assert.strictEqual(check, null);
  });
});
