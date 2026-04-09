const embeddingService = require('./embeddingService');
const logger = require('../utils/logger');

/**
 * @param {string} query - natural language query
 * @param {number} k - number of results (3–5)
 * @returns {{ content: string, file: string, relevance_score: number }[]}
 */
const retrieve = async (query, k = 5) => {
  const results = await embeddingService.search(query, k);
  logger.info(`Retrieved ${results.length} chunks for query: "${query.slice(0, 60)}"`);

  return results.map((r) => ({
    content: r.content,
    file: r.filePath,
    relevance_score: parseFloat(r.score.toFixed(4)),
  }));
};

module.exports = { retrieve };
