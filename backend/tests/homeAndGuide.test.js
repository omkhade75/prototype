import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/database/db.js';
import { initializeSchema } from '../src/database/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

test('Home and User Guide Verification Suite', async (t) => {
  initializeSchema();

  await t.test('Home.jsx component exists with required sections', () => {
    const homePath = path.join(rootDir, 'frontend', 'src', 'pages', 'Home.jsx');
    assert.ok(fs.existsSync(homePath), 'Home.jsx must exist');
    const content = fs.readFileSync(homePath, 'utf8');

    assert.ok(content.includes('HP Victus'), 'Home.jsx must include HP Victus hardware calibration card');
    assert.ok(content.includes('Local System Readiness Checklist'), 'Home.jsx must include local readiness checklist');
    assert.ok(content.includes('Suggested 3-Step Journey'), 'Home.jsx must include beginner journey');
    assert.ok(content.includes('AI Software Engineer'), 'Home.jsx must include link to Software Engineer workspace');
    assert.ok(content.includes('Course-to-Code Lab'), 'Home.jsx must include link to Course-to-Code Lab');
    assert.ok(content.includes('AI Model Library'), 'Home.jsx must include link to AI Model Library');
  });

  await t.test('UserGuide.jsx component exists with comprehensive sections A-F', () => {
    const guidePath = path.join(rootDir, 'frontend', 'src', 'pages', 'UserGuide.jsx');
    assert.ok(fs.existsSync(guidePath), 'UserGuide.jsx must exist');
    const content = fs.readFileSync(guidePath, 'utf8');

    // Verify sections A through F
    assert.ok(content.includes('Section A: ORBIT AI Architecture & Integrated Workflows'), 'Section A must cover architecture');
    assert.ok(content.includes('Section B: What Each Sidebar Tab Does'), 'Section B must cover tab-by-tab walkthrough');
    assert.ok(content.includes('Section C: Which Feature Should I Use? (Goal-Based Guide)'), 'Section C must cover goal routes');
    assert.ok(content.includes('Section D: Beginner Tutorials'), 'Section D must cover hands-on tutorials');
    assert.ok(content.includes('Section E: Demo Mode, Ollama & Offline Feature Matrix'), 'Section E must cover offline vs docker matrix');
    assert.ok(content.includes('Section F: Practical Troubleshooting & Solutions'), 'Section F must cover troubleshooting');
  });

  await t.test('Sidebar.jsx registers Home and User Guide at top of navigation', () => {
    const sidebarPath = path.join(rootDir, 'frontend', 'src', 'components', 'Sidebar.jsx');
    assert.ok(fs.existsSync(sidebarPath), 'Sidebar.jsx must exist');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.ok(content.includes("id: 'home'"), "Sidebar must register 'home' tab");
    assert.ok(content.includes("id: 'user-guide'"), "Sidebar must register 'user-guide' tab");
  });

  await t.test('App.jsx configures Home as default tab and handles guide navigation', () => {
    const appPath = path.join(rootDir, 'frontend', 'src', 'App.jsx');
    assert.ok(fs.existsSync(appPath), 'App.jsx must exist');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(content.includes("useState('home')"), "Default currentTab must be 'home'");
    assert.ok(content.includes('<Home'), 'App must render Home component');
    assert.ok(content.includes('<UserGuide'), 'App must render UserGuide component');
  });

  await t.test('SoftwareEngineer.jsx contains line numbers, copy button, and workspace overview', () => {
    const sePath = path.join(rootDir, 'frontend', 'src', 'pages', 'SoftwareEngineer.jsx');
    assert.ok(fs.existsSync(sePath), 'SoftwareEngineer.jsx must exist');
    const content = fs.readFileSync(sePath, 'utf8');

    assert.ok(content.includes('handleCopyCode'), 'SoftwareEngineer must have copy code action');
    assert.ok(content.includes('Workspace Overview'), 'SoftwareEngineer must have Workspace Overview state');
    assert.ok(content.includes('idx + 1'), 'SoftwareEngineer must have line numbers gutter');
  });
});
