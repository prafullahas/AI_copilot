const retrievalService = require('../services/retrievalService');

const MAX_QUERY_LENGTH = 1000;

const retrieve = async (req, res) => {
  const { query, k } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `Query too long (max ${MAX_QUERY_LENGTH} chars)` });
  }

  const safeK = Math.min(Math.max(parseInt(k) || 5, 1), 20);

  try {
    const results = await retrievalService.retrieve(query, safeK);
    res.json({ query, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { retrieve };
