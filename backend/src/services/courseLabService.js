import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from '../database/db.js';
import { ModelService } from './modelService.js';
dotenv.config();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class CourseLabService {
  /**
   * Lists all courses with module and lesson counts.
   */
  static listCourses() {
    const courses = db.prepare('SELECT * FROM course_materials ORDER BY created_at DESC').all();
    return courses.map((c) => {
      const modCount = db.prepare('SELECT COUNT(*) as count FROM course_modules WHERE course_id = ?').get(c.id).count;
      const lesCount = db.prepare('SELECT COUNT(*) as count FROM course_lessons WHERE course_id = ?').get(c.id).count;
      const snipCount = db.prepare('SELECT COUNT(*) as count FROM course_snippets WHERE course_id = ?').get(c.id).count;
      return {
        ...c,
        module_count: modCount,
        lesson_count: lesCount,
        snippet_count: snipCount
      };
    });
  }

  /**
   * Retrieves single course with nested modules and lessons.
   */
  static getCourseById(courseId) {
    const course = db.prepare('SELECT * FROM course_materials WHERE id = ?').get(courseId);
    if (!course) return null;

    const modules = db.prepare(`
      SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC, created_at ASC
    `).all(courseId);

    const modulesWithLessons = modules.map((m) => {
      const lessons = db.prepare(`
        SELECT * FROM course_lessons WHERE module_id = ? ORDER BY order_index ASC, created_at ASC
      `).all(m.id);
      return {
        ...m,
        lessons: lessons.map((les) => ({
          ...les,
          source_pages: JSON.parse(les.source_pages_json || '[]')
        }))
      };
    });

    const snippets = db.prepare(`
      SELECT * FROM course_snippets WHERE course_id = ? ORDER BY created_at DESC
    `).all(courseId);

    return {
      ...course,
      modules: modulesWithLessons,
      snippets: snippets.map((s) => ({
        ...s,
        tags: JSON.parse(s.tags_json || '[]')
      }))
    };
  }

  /**
   * Creates a new course material workspace.
   */
  static createCourse({ title, code, description }) {
    if (!title || !title.trim()) {
      throw new Error('Course title is required.');
    }
    const id = `course_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO course_materials (id, title, code, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(id, title.trim(), (code || '').trim(), (description || '').trim());

    return this.getCourseById(id);
  }

  /**
   * Adds a module to an existing course.
   */
  static createModule({ courseId, title, orderIndex = 0, description = '' }) {
    if (!title || !title.trim()) throw new Error('Module title is required.');
    const id = `mod_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO course_modules (id, course_id, title, order_index, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, courseId, title.trim(), orderIndex, description.trim());

    return db.prepare('SELECT * FROM course_modules WHERE id = ?').get(id);
  }

  /**
   * Adds a lesson to a module.
   */
  static createLesson({
    courseId,
    moduleId,
    title,
    content = '',
    assignmentInstructions = '',
    sourceDocId = null,
    sourceFilename = null,
    sourcePages = []
  }) {
    if (!title || !title.trim()) throw new Error('Lesson title is required.');
    const id = `les_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO course_lessons (
        id, module_id, course_id, title, content, assignment_instructions,
        source_doc_id, source_filename, source_pages_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_started')
    `).run(
      id,
      moduleId,
      courseId,
      title.trim(),
      content.trim(),
      assignmentInstructions.trim(),
      sourceDocId,
      sourceFilename,
      JSON.stringify(sourcePages || [])
    );

    return db.prepare('SELECT * FROM course_lessons WHERE id = ?').get(id);
  }

  /**
   * Links a previously uploaded Knowledge Hub document to a lesson.
   */
  static linkKnowledgeHubDocument(lessonId, docId) {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    if (!doc) throw new Error(`Knowledge Hub document #${docId} not found.`);

    const chunks = db.prepare('SELECT page_number, content FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC').all(docId);
    const combinedContent = chunks.map((c) => c.content).join('\n\n');
    const pages = [...new Set(chunks.map((c) => c.page_number))];

    db.prepare(`
      UPDATE course_lessons
      SET 
        source_doc_id = ?,
        source_filename = ?,
        source_pages_json = ?,
        content = CASE WHEN length(content) > 0 THEN content || '\n\n' || ? ELSE ? END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(docId, doc.filename, JSON.stringify(pages), combinedContent, combinedContent, lessonId);

    return db.prepare('SELECT * FROM course_lessons WHERE id = ?').get(lessonId);
  }

  /**
   * Lists code snippets across a course or lesson.
   */
  static listSnippets({ courseId = null, lessonId = null }) {
    let sql = 'SELECT * FROM course_snippets WHERE 1=1';
    const params = [];
    if (courseId) {
      sql += ' AND course_id = ?';
      params.push(courseId);
    }
    if (lessonId) {
      sql += ' AND lesson_id = ?';
      params.push(lessonId);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params);
    return rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags_json || '[]')
    }));
  }

  /**
   * Saves a code snippet to the scratchpad drawer.
   */
  static addSnippet({
    courseId,
    lessonId = null,
    title,
    language = 'python',
    code,
    explanation = '',
    tags = [],
    sourceSection = ''
  }) {
    if (!code || !code.trim()) throw new Error('Code content is required.');
    const id = `snip_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    db.prepare(`
      INSERT INTO course_snippets (
        id, lesson_id, course_id, title, language, code, explanation, tags_json, source_section
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      lessonId,
      courseId,
      (title || 'Untitled Code Snippet').trim(),
      language.toLowerCase(),
      code.trim(),
      (explanation || '').trim(),
      JSON.stringify(tags || []),
      sourceSection || ''
    );

    this.logProgress({
      itemType: 'snippet',
      itemId: id,
      action: 'saved_snippet',
      details: { title, language }
    });

    return db.prepare('SELECT * FROM course_snippets WHERE id = ?').get(id);
  }

  /**
   * Deletes a code snippet.
   */
  static deleteSnippet(snippetId) {
    const res = db.prepare('DELETE FROM course_snippets WHERE id = ?').run(snippetId);
    return res.changes > 0;
  }

  /**
   * Calls AI Service Assistant Learn endpoint.
   */
  static async callAssistantLearn(payload) {
    const active = ModelService.getActiveModelConfig();
    const body = {
      provider: payload.provider || active.provider || 'demo',
      model: payload.model || active.model || 'llama3',
      ...payload
    };

    const res = await fetch(`${AI_SERVICE_URL}/course-lab/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Assistant Learn failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (payload.lessonId) {
      this.logProgress({
        itemType: 'lesson',
        itemId: payload.lessonId,
        action: 'explained',
        details: { provider: body.provider, model: body.model }
      });
    }
    return data;
  }

  /**
   * Calls AI Service Assistant Explain Code endpoint.
   */
  static async callAssistantExplainCode(payload) {
    const active = ModelService.getActiveModelConfig();
    const body = {
      provider: payload.provider || active.provider || 'demo',
      model: payload.model || active.model || 'llama3',
      ...payload
    };

    const res = await fetch(`${AI_SERVICE_URL}/course-lab/explain-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Assistant Explain Code failed (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Calls AI Service Assistant Debug endpoint.
   */
  static async callAssistantDebug(payload) {
    const active = ModelService.getActiveModelConfig();
    const body = {
      provider: payload.provider || active.provider || 'demo',
      model: payload.model || active.model || 'llama3',
      ...payload
    };

    const res = await fetch(`${AI_SERVICE_URL}/course-lab/debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Assistant Debug failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    this.logProgress({
      itemType: 'snippet',
      itemId: payload.snippetId || 'debug_attempt',
      action: 'debugged',
      details: { runner: data.runner_verification }
    });
    return data;
  }

  /**
   * Calls AI Service Assistant Practise endpoint.
   */
  static async callAssistantPractise(payload) {
    const active = ModelService.getActiveModelConfig();
    const body = {
      provider: payload.provider || active.provider || 'demo',
      ...payload
    };

    const res = await fetch(`${AI_SERVICE_URL}/course-lab/practise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Assistant Practise failed (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Builds an ordered Jupyter Notebook (.ipynb) and persists to SQLite.
   */
  static async buildNotebook({
    title,
    goal,
    cells,
    courseId = null,
    dependencies = []
  }) {
    if (!title || !title.trim()) throw new Error('Notebook title is required.');
    if (!cells || !cells.length) throw new Error('At least one code or markdown cell is required.');

    const res = await fetch(`${AI_SERVICE_URL}/course-lab/notebook/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        goal,
        cells,
        dependencies
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to build notebook (HTTP ${res.status})`);
    }

    const buildResult = await res.json();
    const notebookId = `nb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Validate notebook immediately
    const valRes = await this.validateNotebook({
      notebookData: buildResult.notebook_json,
      executeCells: false
    });

    db.prepare(`
      INSERT INTO course_notebooks (
        id, title, goal, language, course_id, cells_json, ipynb_json, validation_result_json, source_snippets_json
      ) VALUES (?, ?, ?, 'python', ?, ?, ?, ?, ?)
    `).run(
      notebookId,
      buildResult.title,
      buildResult.goal,
      courseId,
      JSON.stringify(cells),
      buildResult.ipynb_str,
      JSON.stringify(valRes),
      JSON.stringify(cells.map((c) => c.snippet_id || c.title || ''))
    );

    this.logProgress({
      itemType: 'notebook',
      itemId: notebookId,
      action: 'generated_notebook',
      details: { title: buildResult.title, cells: buildResult.total_cells }
    });

    return {
      notebook_id: notebookId,
      ...buildResult,
      validation: valRes
    };
  }

  /**
   * Validates notebook structure, syntax, and dependencies.
   */
  static async validateNotebook({ notebookData, executeCells = false, notebookId = null }) {
    const res = await fetch(`${AI_SERVICE_URL}/course-lab/notebook/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notebook_data: notebookData,
        execute_cells: executeCells
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Validation failed (HTTP ${res.status})`);
    }

    const valResult = await res.json();

    if (notebookId) {
      db.prepare(`
        UPDATE course_notebooks
        SET validation_result_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(valResult), notebookId);
    }

    return valResult;
  }

  /**
   * Lists generated course notebooks.
   */
  static listNotebooks(courseId = null) {
    let sql = 'SELECT id, title, goal, language, course_id, created_at, updated_at FROM course_notebooks';
    const params = [];
    if (courseId) {
      sql += ' WHERE course_id = ?';
      params.push(courseId);
    }
    sql += ' ORDER BY created_at DESC';

    return db.prepare(sql).all(...params);
  }

  /**
   * Retrieves single notebook with full .ipynb JSON.
   */
  static getNotebookById(notebookId) {
    const row = db.prepare('SELECT * FROM course_notebooks WHERE id = ?').get(notebookId);
    if (!row) return null;

    return {
      ...row,
      cells: JSON.parse(row.cells_json || '[]'),
      notebook_json: JSON.parse(row.ipynb_json || '{}'),
      validation: JSON.parse(row.validation_result_json || '{}')
    };
  }

  /**
   * Logs student action into course_progress table.
   */
  static logProgress({ itemType, itemId, action, score = null, details = {} }) {
    db.prepare(`
      INSERT INTO course_progress (item_type, item_id, action, score, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(itemType, itemId, action, score, JSON.stringify(details || {}));
  }

  /**
   * Aggregates personal learning progress.
   */
  static getProgressSummary() {
    const coursesCount = db.prepare('SELECT COUNT(*) as count FROM course_materials').get().count;
    const lessonsCount = db.prepare('SELECT COUNT(*) as count FROM course_lessons').get().count;
    const snippetsCount = db.prepare('SELECT COUNT(*) as count FROM course_snippets').get().count;
    const notebooksCount = db.prepare('SELECT COUNT(*) as count FROM course_notebooks').get().count;

    const actionCounts = db.prepare(`
      SELECT action, COUNT(*) as count FROM course_progress GROUP BY action
    `).all();

    const stats = {};
    for (const a of actionCounts) {
      stats[a.action] = a.count;
    }

    const recentLogs = db.prepare(`
      SELECT * FROM course_progress ORDER BY created_at DESC LIMIT 15
    `).all();

    return {
      total_courses: coursesCount,
      total_lessons: lessonsCount,
      total_snippets: snippetsCount,
      total_notebooks: notebooksCount,
      lessons_reviewed: stats.explained || 0,
      exercises_attempted: (stats.attempted || 0) + (stats.solved_independently || 0),
      solved_independently: stats.solved_independently || 0,
      solutions_viewed: stats.revealed_solution || 0,
      recent_activity: recentLogs.map((l) => ({
        ...l,
        details: JSON.parse(l.details_json || '{}')
      }))
    };
  }
}
