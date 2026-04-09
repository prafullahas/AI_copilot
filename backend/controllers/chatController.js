const retrievalService = require('../services/retrievalService');
const llmService = require('../services/llmService');

const chat = async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const chunks = await retrievalService.retrieve(question, 3);

    if (chunks.length === 0) {
      return res.json({
        answer: 'Not found in codebase',
        referencedFiles: [],
      });
    }

    const result = await llmService.generateAnswer(question, chunks);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat };
