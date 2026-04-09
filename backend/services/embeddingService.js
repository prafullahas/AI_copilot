/**
 * embeddingService - TF-IDF vectorizer + cosine similarity search.
 *
 * Pure JS, zero native dependencies. Same API as the previous FAISS-based version.
 * Optimized for code search at repo scale (hundreds of chunks).
 */

const logger = require('../utils/logger');

let vocabulary = new Map(); // term -> index
let idf = [];              // idf[termIndex] = IDF value
let vectors = [];          // vectors[docIndex] = Float64Array (TF-IDF)
let metadata = [];         // metadata[docIndex] = { filePath, type, content, preview }

// --- Tokenizer (code-aware) ---

const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
};

// --- Reset ---

const resetIndex = () => {
  vocabulary = new Map();
  idf = [];
  vectors = [];
  metadata = [];
};

// --- Build TF-IDF vectors for all chunks ---

const embedAndStore = async (chunks) => {
  resetIndex();

  // 1. Tokenize all docs
  const docs = chunks.map((c) => tokenize(c.content));

  // 2. Build vocabulary + document frequency
  const df = new Map();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const t of seen) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  // 3. Assign indices and compute IDF
  let idx = 0;
  const n = docs.length;
  for (const [term, freq] of df) {
    vocabulary.set(term, idx);
    idx++;
  }
  idf = new Float64Array(vocabulary.size);
  for (const [term, freq] of df) {
    idf[vocabulary.get(term)] = Math.log((n + 1) / (freq + 1)) + 1;
  }

  // 4. Build TF-IDF vector per doc and store metadata
  for (let i = 0; i < chunks.length; i++) {
    const tf = new Float64Array(vocabulary.size);
    for (const t of docs[i]) {
      const ti = vocabulary.get(t);
      if (ti !== undefined) tf[ti]++;
    }
    // TF-IDF = tf * idf, then L2-normalize
    for (let j = 0; j < tf.length; j++) tf[j] *= idf[j];
    const norm = Math.sqrt(tf.reduce((s, v) => s + v * v, 0)) || 1;
    for (let j = 0; j < tf.length; j++) tf[j] /= norm;

    vectors.push(tf);
    metadata.push({
      filePath: chunks[i].filePath,
      type: chunks[i].type,
      content: chunks[i].content,
      preview: chunks[i].content.split('\n')[0].trim(),
    });
  }

  const dimension = vocabulary.size;
  logger.info(`Stored ${metadata.length} vectors (${dimension}-dim TF-IDF)`);
  return { totalEmbeddings: metadata.length, dimension };
};

// --- Vectorize a query ---

const embedQuery = (text) => {
  const tokens = tokenize(text);
  const vec = new Float64Array(vocabulary.size);
  for (const t of tokens) {
    const ti = vocabulary.get(t);
    if (ti !== undefined) vec[ti] = idf[ti];
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  for (let j = 0; j < vec.length; j++) vec[j] /= norm;
  return vec;
};

// --- Cosine similarity (dot product of L2-normalized vectors) ---

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

// --- Search ---

const search = async (query, k = 5) => {
  if (vectors.length === 0) return [];

  const qVec = embedQuery(query);
  const scores = vectors.map((v, i) => ({ i, score: dot(qVec, v) }));
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, k).map((s) => ({
    ...metadata[s.i],
    score: s.score,
  }));
};

module.exports = { embedAndStore, search, resetIndex };
