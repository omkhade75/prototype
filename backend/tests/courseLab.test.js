import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { db } from '../src/database/db.js';
import { initializeSchema } from '../src/database/schema.js';
import { seedDatabase } from '../src/database/seed.js';
import { CourseLabService } from '../src/services/courseLabService.js';

test('Course-to-Code Lab Backend Service & Persistence Suite', async (t) => {
  // Ensure schema and seeds are active
  initializeSchema();
  seedDatabase();
  const app = createApp();

  let testCourseId = null;
  let testModuleId = null;
  let testLessonId = null;
  let testSnippetId = null;
  let testNotebookId = null;

  await t.test('listCourses returns seeded CS106B course with modules and lessons', () => {
    const courses = CourseLabService.listCourses();
    assert.ok(Array.isArray(courses));
    assert.ok(courses.length > 0);
    const cs106 = courses.find((c) => c.id === 'course_cs106b');
    assert.ok(cs106);
    assert.strictEqual(cs106.code, 'CS106B');
    assert.ok(cs106.module_count >= 2);
    assert.ok(cs106.lesson_count >= 2);
  });

  await t.test('createCourse, createModule, and createLesson persist workspace hierarchy', () => {
    // 1. Create course
    const course = CourseLabService.createCourse({
      title: 'CS 107: Computer Organization & Systems',
      code: 'CS107',
      description: 'C programming, bit manipulation, memory hierarchy, and x86 assembly.'
    });
    assert.ok(course.id);
    assert.strictEqual(course.code, 'CS107');
    testCourseId = course.id;

    // 2. Create module
    const mod = CourseLabService.createModule({
      courseId: testCourseId,
      title: 'Module 1: Bitwise Operations & Masks',
      orderIndex: 0,
      description: 'Bitwise AND, OR, XOR, shifts, and two-complement representation.'
    });
    assert.ok(mod.id);
    assert.strictEqual(mod.title, 'Module 1: Bitwise Operations & Masks');
    testModuleId = mod.id;

    // 3. Create lesson
    const lesson = CourseLabService.createLesson({
      courseId: testCourseId,
      moduleId: testModuleId,
      title: 'Bitmask Manipulation and Bit Counting',
      content: 'Bitwise operations allow compact state encoding. Count set bits using Brian Kernighan algorithm.',
      assignmentInstructions: 'Implement count_bits(n) in C++ and Python.'
    });
    assert.ok(lesson.id);
    assert.strictEqual(lesson.title, 'Bitmask Manipulation and Bit Counting');
    testLessonId = lesson.id;

    // Verify retrieval in course details
    const fullCourse = CourseLabService.getCourseById(testCourseId);
    assert.strictEqual(fullCourse.modules.length, 1);
    assert.strictEqual(fullCourse.modules[0].lessons.length, 1);
  });

  await t.test('linkKnowledgeHubDocument links document chunks and updates source citations', () => {
    // Get seeded document ID
    const doc = db.prepare('SELECT id, filename FROM documents LIMIT 1').get();
    assert.ok(doc, 'Seed document must exist');

    const updatedLesson = CourseLabService.linkKnowledgeHubDocument(testLessonId, doc.id);
    assert.strictEqual(updatedLesson.source_doc_id, doc.id);
    assert.strictEqual(updatedLesson.source_filename, doc.filename);
    assert.ok(updatedLesson.content.length > 50);
  });

  await t.test('addSnippet, listSnippets, and deleteSnippet manage code scratchpad', () => {
    // 1. Add snippet
    const snip = CourseLabService.addSnippet({
      courseId: testCourseId,
      lessonId: testLessonId,
      title: 'Kernighan Bit Count',
      language: 'python',
      code: 'def count_bits(n):\n    count = 0\n    while n:\n        n &= (n - 1)\n        count += 1\n    return count\n',
      explanation: 'Clears lowest set bit in O(k) steps where k is number of set bits.',
      tags: ['bits', 'bitwise', 'math'],
      sourceSection: 'Lecture 1: Bitwise Operations'
    });

    assert.ok(snip.id);
    testSnippetId = snip.id;

    // 2. List snippets
    const snippets = CourseLabService.listSnippets({ courseId: testCourseId });
    assert.ok(snippets.length >= 1);
    const found = snippets.find((s) => s.id === testSnippetId);
    assert.ok(found);
    assert.strictEqual(found.title, 'Kernighan Bit Count');
    assert.strictEqual(found.language, 'python');

    // 3. Delete snippet
    const deleted = CourseLabService.deleteSnippet(testSnippetId);
    assert.strictEqual(deleted, true);
    const afterDelete = CourseLabService.listSnippets({ courseId: testCourseId });
    assert.strictEqual(afterDelete.some((s) => s.id === testSnippetId), false);
  });

  await t.test('buildNotebook, validateNotebook, and listNotebooks manage .ipynb persistence', async () => {
    // Mock global fetch for AI service calls
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (url.includes('/course-lab/notebook/build')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            title: 'Bits Lab Notebook',
            goal: 'Execute bit manipulation algorithms',
            total_cells: 5,
            code_cells_count: 2,
            markdown_cells_count: 3,
            ipynb_str: JSON.stringify({
              nbformat: 4,
              nbformat_minor: 5,
              metadata: { kernelspec: { name: 'python3', language: 'python' } },
              cells: [
                { cell_type: 'markdown', source: ['# Bits Lab\n'] },
                { cell_type: 'code', source: ['x = 42\n'], outputs: [], execution_count: null }
              ]
            }),
            notebook_json: {
              nbformat: 4,
              nbformat_minor: 5,
              metadata: {},
              cells: []
            }
          })
        };
      }
      if (url.includes('/course-lab/notebook/validate')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            valid: true,
            syntax_valid: true,
            schema_valid: true,
            errors: [],
            warnings: [],
            execution_status: 'unverified_docker_unavailable'
          })
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      // 1. Build notebook
      const buildRes = await CourseLabService.buildNotebook({
        title: 'Bits Lab Notebook',
        goal: 'Execute bit manipulation algorithms',
        cells: [
          { cell_type: 'code', title: 'Bit Masking', code: 'x = 0xFF\n' }
        ],
        courseId: testCourseId
      });

      assert.ok(buildRes.notebook_id);
      assert.strictEqual(buildRes.title, 'Bits Lab Notebook');
      assert.strictEqual(buildRes.validation.valid, true);
      testNotebookId = buildRes.notebook_id;

      // 2. Retrieve notebook by ID
      const retrieved = CourseLabService.getNotebookById(testNotebookId);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.title, 'Bits Lab Notebook');
      assert.ok(retrieved.ipynb_json);

      // 3. List notebooks
      const notebooks = CourseLabService.listNotebooks(testCourseId);
      assert.ok(notebooks.length >= 1);
      assert.ok(notebooks.some((n) => n.id === testNotebookId));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('logProgress and getProgressSummary track student lab actions', () => {
    CourseLabService.logProgress({
      itemType: 'exercise',
      itemId: 'ex_bits_kernighan',
      action: 'solved_independently',
      details: { attempts: 1 }
    });

    CourseLabService.logProgress({
      itemType: 'lesson',
      itemId: testLessonId,
      action: 'explained',
      details: { mode: 'learn' }
    });

    const summary = CourseLabService.getProgressSummary();
    assert.ok(summary.total_courses >= 1);
    assert.ok(summary.total_lessons >= 1);
    assert.ok(summary.solved_independently >= 1);
    assert.ok(summary.lessons_reviewed >= 1);
    assert.ok(Array.isArray(summary.recent_activity));
    assert.ok(summary.recent_activity.length >= 2);
  });

  // Clean up test course and cascade records
  if (testCourseId) {
    db.prepare('DELETE FROM course_materials WHERE id = ?').run(testCourseId);
  }
  if (testNotebookId) {
    db.prepare('DELETE FROM course_notebooks WHERE id = ?').run(testNotebookId);
  }
});
