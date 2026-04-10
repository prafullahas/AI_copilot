const retrievalService = require('../services/retrievalService');

const MAX_QUERY_LENGTH = 1000;

const search = async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `Query too long (max ${MAX_QUERY_LENGTH} chars)` });
  }

  try {
    const results = await retrievalService.retrieve(query, 5);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { search };
