/**
 * embeddingService - TF-IDF vectorizer + cosine similarity search.
 * Supports multiple repos stored in memory with one-click switching.
 */

const logger = require('../utils/logger');

// Per-repo storage
const repoStore = new Map(); // repoUrl -> { vocabulary, idf, vectors, metadata }
let activeRepoUrl = null;

// Active working set
let vocabulary = new Map();
let idf = [];
let vectors = [];
let metadata = [];

const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
};

const resetIndex = () => {
  vocabulary = new Map();
  idf = [];
  vectors = [];
  metadata = [];
};

const embedAndStore = async (chunks, repoUrl) => {
  resetIndex();

  const docs = chunks.map((c) => tokenize(c.content));

  const df = new Map();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const t of seen) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  let idx = 0;
  const n = docs.length;
  for (const [term] of df) {
    vocabulary.set(term, idx);
    idx++;
  }
  idf = new Float64Array(vocabulary.size);
  for (const [term, freq] of df) {
    idf[vocabulary.get(term)] = Math.log((n + 1) / (freq + 1)) + 1;
  }

  for (let i = 0; i < chunks.length; i++) {
    const tf = new Float64Array(vocabulary.size);
    for (const t of docs[i]) {
      const ti = vocabulary.get(t);
      if (ti !== undefined) tf[ti]++;
    }
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

  // Store this repo's data
  if (repoUrl) {
    repoStore.set(repoUrl, {
      vocabulary: new Map(vocabulary),
      idf: new Float64Array(idf),
      vectors: [...vectors],
      metadata: [...metadata],
    });
    activeRepoUrl = repoUrl;
  }

  const dimension = vocabulary.size;
  logger.info(`Stored ${metadata.length} vectors (${dimension}-dim) for ${repoUrl || 'unknown'}`);
  return { totalEmbeddings: metadata.length, dimension };
};

const switchRepo = (repoUrl) => {
  if (!repoStore.has(repoUrl)) {
    throw new Error('Repository not found in store');
  }
  const data = repoStore.get(repoUrl);
  vocabulary = new Map(data.vocabulary);
  idf = new Float64Array(data.idf);
  vectors = [...data.vectors];
  metadata = [...data.metadata];
  activeRepoUrl = repoUrl;
  logger.info(`Switched to repo: ${repoUrl} (${metadata.length} vectors)`);
  return { repo: repoUrl, totalEmbeddings: metadata.length };
};

const getStoredRepos = () => {
  return [...repoStore.entries()].map(([url, data]) => ({
    repo: url,
    chunkCount: data.metadata.length,
    active: url === activeRepoUrl,
  }));
};

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

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

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

module.exports = { embedAndStore, search, resetIndex, switchRepo, getStoredRepos };
