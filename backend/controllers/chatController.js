const retrievalService = require('../services/retrievalService');
const llmService = require('../services/llmService');

const MAX_QUESTION_LENGTH = 2000;

const chat = async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' });
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({ error: `Question too long (max ${MAX_QUESTION_LENGTH} chars)` });
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
