import { ModelService } from '../services/modelService.js';

export class ModelController {
  static async getCatalog(req, res) {
    try {
      const data = await ModelService.getCatalog(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getModelCard(req, res) {
    try {
      const card = await ModelService.getModelCard(req.params.modelId);
      res.json({ success: true, model: card });
    } catch (err) {
      res.status(404).json({ success: false, error: err.message });
    }
  }

  static async getPresets(req, res) {
    try {
      const presets = await ModelService.getHardwarePresets();
      res.json({ success: true, ...presets });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recommend(req, res) {
    try {
      const recs = await ModelService.recommendModels(req.body);
      res.json({ success: true, ...recs });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getLocalModels(req, res) {
    try {
      const local = await ModelService.getLocalModels();
      res.json({ success: true, ...local });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async inspectLocalModel(req, res) {
    try {
      const { model_name } = req.body;
      const details = await ModelService.inspectLocalModel(model_name);
      res.json({ success: true, details });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async deleteLocalModel(req, res) {
    try {
      const { modelName } = req.params;
      const confirmed = req.query.confirmed === 'true';
      const result = await ModelService.deleteLocalModel(modelName, confirmed);
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async testModel(req, res) {
    try {
      const { model_name, prompt, system_prompt, category } = req.body;
      const result = await ModelService.testModel({
        modelName: model_name,
        prompt,
        systemPrompt: system_prompt,
        category
      });
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async saveRubric(req, res) {
    try {
      const { testId } = req.params;
      const rubric = req.body;
      const ok = ModelService.saveRubricEvaluation(testId, rubric);
      res.json({ success: ok });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listTestRuns(req, res) {
    try {
      const limit = parseInt(req.query.limit || '20', 10);
      const runs = ModelService.listTestRuns(limit);
      res.json({ success: true, runs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveComparison(req, res) {
    try {
      const { title, models, prompt, comparison_data } = req.body;
      const session = ModelService.saveComparison({
        title,
        models,
        prompt,
        comparisonData: comparison_data
      });
      res.status(201).json({ success: true, session });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listComparisons(req, res) {
    try {
      const comparisons = ModelService.listComparisons();
      res.json({ success: true, comparisons });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getActiveConfig(req, res) {
    try {
      const config = ModelService.getActiveModelConfig();
      res.json({ success: true, config });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async setActiveConfig(req, res) {
    try {
      const { provider, model, task } = req.body;
      const updated = ModelService.setActiveModelConfig({ provider, model, task });
      res.json({ success: true, config: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async searchHuggingFace(req, res) {
    try {
      const query = req.query.q || 'coder';
      const limit = parseInt(req.query.limit || '8', 10);
      const data = await ModelService.searchHuggingFace(query, limit);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
