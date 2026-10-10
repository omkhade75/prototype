import express from 'express';
import { ModelController } from '../controllers/modelController.js';

const router = express.Router();

// Catalog Discovery & Metadata
router.get('/catalog', ModelController.getCatalog);
router.get('/catalog/:modelId', ModelController.getModelCard);
router.get('/presets', ModelController.getPresets);
router.post('/recommend', ModelController.recommend);
router.get('/huggingface', ModelController.searchHuggingFace);

// Local Ollama Models
router.get('/local', ModelController.getLocalModels);
router.post('/local/inspect', ModelController.inspectLocalModel);
router.delete('/local/:modelName', ModelController.deleteLocalModel);

// Testing & Benchmarking
router.post('/test', ModelController.testModel);
router.post('/test/:testId/rubric', ModelController.saveRubric);
router.get('/test-runs', ModelController.listTestRuns);

// Comparison Sessions
router.post('/comparisons', ModelController.saveComparison);
router.get('/comparisons', ModelController.listComparisons);

// Active Model Configuration
router.get('/config', ModelController.getActiveConfig);
router.post('/config', ModelController.setActiveConfig);

export default router;
