/**
 * embeddingService - Local embeddings via @xenova/transformers + FAISS vector storage.
 *
 * Model: Xenova/all-MiniLM-L6-v2 (384-dim, runs locally via ONNX)
 * Index: FAISS IndexFlatIP (inner product on normalized vectors = cosine similarity)
 */

const { IndexFlatIP } = require('faiss-node');
const logger = require('../utils/logger');

const DIMENSION = 384;

let extractor = null;
let index = null;
let metadata = []; // parallel array: metadata[i] corresponds to FAISS vector at position i

// --- Lazy model init ---

const init = async () => {
  if (extractor) return;
  logger.info('Loading embedding model (first call only)...');
  const { pipeline } = await import('@xenova/transformers');
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  logger.info('Embedding model loaded');
};

// --- Reset index (called per ingestion to avoid stale data) ---

const resetIndex = () => {
  index = new IndexFlatIP(DIMENSION);
  metadata = [];
};

// --- Generate embedding for a single text ---

const embed = async (text) => {
  await init();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

// --- Embed an array of chunks and store in FAISS ---

/**
 * @param {{ content: string, filePath: string, type: string }[]} chunks
 * @returns {{ totalEmbeddings: number, dimension: number }}
 */
const embedAndStore = async (chunks) => {
  await init();
  resetIndex();

  for (const chunk of chunks) {
    const vector = await embed(chunk.content);
    index.add(vector);
    metadata.push({
      filePath: chunk.filePath,
      type: chunk.type,
      preview: chunk.content.split('\n')[0].trim(),
    });
  }

  logger.info(`Stored ${metadata.length} embeddings (${DIMENSION}-dim)`);
  return { totalEmbeddings: metadata.length, dimension: DIMENSION };
};

// --- Search the index ---

/**
 * @param {string} query - natural language query
 * @param {number} k - number of results
 * @returns {{ filePath: string, type: string, preview: string, score: number }[]}
 */
const search = async (query, k = 5) => {
  if (!index || metadata.length === 0) {
    return [];
  }
  const vector = await embed(query);
  const safeK = Math.min(k, metadata.length);
  const { distances, labels } = index.search(vector, safeK);

  return labels.map((idx, i) => ({
    ...metadata[idx],
    score: distances[i],
  }));
};

module.exports = { embedAndStore, search, resetIndex };
