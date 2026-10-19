import { Router } from 'express';
import { AIService } from '../services/aiService.js';

const router = Router();

// GET /api/system/metrics (Live CPU, RAM, Battery, Power Plan)
router.get('/metrics', async (req, res, next) => {
  try {
    const data = await AIService.getSystemStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/system/status
router.get('/status', async (req, res, next) => {
  try {
    const data = await AIService.getSystemStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/system/power/shutdown
router.post('/power/shutdown', async (req, res, next) => {
  try {
    const { minutes, reason } = req.body;
    const data = await AIService.scheduleShutdown(minutes, reason);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/system/power/cancel
router.post('/power/cancel', async (req, res, next) => {
  try {
    const data = await AIService.cancelShutdown();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/system/optimize/performance
router.post('/optimize/performance', async (req, res, next) => {
  try {
    const data = await AIService.optimizePerformance();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/system/optimize/network
router.post('/optimize/network', async (req, res, next) => {
  try {
    const data = await AIService.optimizeNetwork();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/system/prompt
router.post('/prompt', async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const data = await AIService.handleSystemPrompt(prompt);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
