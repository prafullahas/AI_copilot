const embeddingService = require('./embeddingService');
const logger = require('../utils/logger');

const RELEVANCE_THRESHOLD = 0.2;

/**
 * @param {string} query - natural language query
 * @param {number} k - number of results (3–5)
 * @returns {{ content: string, file: string, relevance_score: number }[]}
 */
const retrieve = async (query, k = 5) => {
  const results = await embeddingService.search(query, k);

  const filtered = results
    .map((r) => ({
      content: r.content,
      file: r.filePath,
      relevance_score: parseFloat(r.score.toFixed(4)),
    }))
    .filter((r) => r.relevance_score >= RELEVANCE_THRESHOLD);

  logger.info(`Retrieved ${filtered.length}/${results.length} chunks above threshold ${RELEVANCE_THRESHOLD}`);
  return filtered;
};

module.exports = { retrieve };
