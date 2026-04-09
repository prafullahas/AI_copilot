const retrievalService = require('../services/retrievalService');

const retrieve = async (req, res) => {
  const { query, k } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const results = await retrievalService.retrieve(query, k || 5);
    res.json({ query, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { retrieve };
