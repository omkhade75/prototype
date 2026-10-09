import { DocumentService } from '../services/documentService.js';

export class DocumentController {
  static async listDocuments(req, res, next) {
    try {
      const docs = DocumentService.getAllDocuments();
      res.json({ success: true, count: docs.length, data: docs });
    } catch (err) {
      next(err);
    }
  }

  static async getDocument(req, res, next) {
    try {
      const doc = DocumentService.getDocumentById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, error: { message: 'Document not found' } });
      }
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  static async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file was uploaded.' } });
      }

      const allowedExts = ['pdf', 'txt', 'md'];
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: { message: `Unsupported file type '.${ext}'. Allowed types: PDF, TXT, MD.` }
        });
      }

      const doc = await DocumentService.processAndSaveDocument(req.file);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDocument(req, res, next) {
    try {
      const deleted = DocumentService.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: { message: 'Document not found' } });
      }
      res.json({ success: true, message: 'Document deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}
