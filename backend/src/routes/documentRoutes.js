import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from '../controllers/documentController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocument);
router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
