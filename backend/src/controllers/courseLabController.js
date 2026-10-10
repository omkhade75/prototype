import { CourseLabService } from '../services/courseLabService.js';

export class CourseLabController {
  static async listCourses(req, res, next) {
    try {
      const courses = CourseLabService.listCourses();
      res.json({ success: true, count: courses.length, data: courses });
    } catch (err) {
      next(err);
    }
  }

  static async getCourse(req, res, next) {
    try {
      const course = CourseLabService.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, error: { message: 'Course not found.' } });
      }
      res.json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  static async createCourse(req, res, next) {
    try {
      const course = CourseLabService.createCourse(req.body);
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  }

  static async createModule(req, res, next) {
    try {
      const mod = CourseLabService.createModule({
        courseId: req.params.courseId,
        ...req.body
      });
      res.status(201).json({ success: true, data: mod });
    } catch (err) {
      next(err);
    }
  }

  static async createLesson(req, res, next) {
    try {
      const lesson = CourseLabService.createLesson({
        courseId: req.params.courseId,
        moduleId: req.params.moduleId,
        ...req.body
      });
      res.status(201).json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  }

  static async linkDocument(req, res, next) {
    try {
      const { lessonId, documentId } = req.body;
      const updated = CourseLabService.linkKnowledgeHubDocument(lessonId, documentId);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async listSnippets(req, res, next) {
    try {
      const { courseId, lessonId } = req.query;
      const snippets = CourseLabService.listSnippets({ courseId, lessonId });
      res.json({ success: true, count: snippets.length, data: snippets });
    } catch (err) {
      next(err);
    }
  }

  static async addSnippet(req, res, next) {
    try {
      const snippet = CourseLabService.addSnippet(req.body);
      res.status(201).json({ success: true, data: snippet });
    } catch (err) {
      next(err);
    }
  }

  static async deleteSnippet(req, res, next) {
    try {
      const deleted = CourseLabService.deleteSnippet(req.params.id);
      res.json({ success: true, deleted });
    } catch (err) {
      next(err);
    }
  }

  static async learn(req, res, next) {
    try {
      const data = await CourseLabService.callAssistantLearn(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async explainCode(req, res, next) {
    try {
      const data = await CourseLabService.callAssistantExplainCode(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async debug(req, res, next) {
    try {
      const data = await CourseLabService.callAssistantDebug(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async practise(req, res, next) {
    try {
      const data = await CourseLabService.callAssistantPractise(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async buildNotebook(req, res, next) {
    try {
      const result = await CourseLabService.buildNotebook(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async validateNotebook(req, res, next) {
    try {
      const result = await CourseLabService.validateNotebook(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listNotebooks(req, res, next) {
    try {
      const notebooks = CourseLabService.listNotebooks(req.query.courseId);
      res.json({ success: true, count: notebooks.length, data: notebooks });
    } catch (err) {
      next(err);
    }
  }

  static async getNotebook(req, res, next) {
    try {
      const nb = CourseLabService.getNotebookById(req.params.id);
      if (!nb) {
        return res.status(404).json({ success: false, error: { message: 'Notebook not found.' } });
      }
      res.json({ success: true, data: nb });
    } catch (err) {
      next(err);
    }
  }

  static async downloadNotebook(req, res, next) {
    try {
      const nb = CourseLabService.getNotebookById(req.params.id);
      if (!nb) {
        return res.status(404).json({ success: false, error: { message: 'Notebook not found.' } });
      }

      const safeFilename = `${nb.title.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}.ipynb`;
      res.setHeader('Content-Type', 'application/x-ipynb+json');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.send(nb.ipynb_json);
    } catch (err) {
      next(err);
    }
  }

  static async logProgress(req, res, next) {
    try {
      CourseLabService.logProgress(req.body);
      res.json({ success: true, message: 'Progress logged.' });
    } catch (err) {
      next(err);
    }
  }

  static async getProgressSummary(req, res, next) {
    try {
      const summary = CourseLabService.getProgressSummary();
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}
