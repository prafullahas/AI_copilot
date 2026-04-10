const repoService = require('../services/repoService');
const embeddingService = require('../services/embeddingService');
const { chunkCode } = require('../utils/chunkCode');
const logger = require('../utils/logger');

const MAX_URL_LENGTH = 300;
const MAX_FILES = 5000;

const ingestRepo = async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  if (repoUrl.length > MAX_URL_LENGTH) {
    return res.status(400).json({ error: `URL too long (max ${MAX_URL_LENGTH} chars)` });
  }

  const githubPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
  if (!githubPattern.test(repoUrl)) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL' });
  }

  try {
    const { repo, fileCount, files } = repoService.ingestRepo(repoUrl);

    if (fileCount > MAX_FILES) {
      return res.status(400).json({ error: `Repository too large (${fileCount} files, max ${MAX_FILES})` });
    }

    const chunks = [];
    for (const file of files) {
      try {
        const fileChunks = chunkCode(file.content, file.path);
        chunks.push(...fileChunks);
      } catch (err) {
        logger.warn(`Skipping file ${file.path}: ${err.message}`);
      }
    }

    const embeddingResult = await embeddingService.embedAndStore(chunks, repoUrl);

    res.json({
      repo,
      fileCount,
      chunkCount: chunks.length,
      embeddings: embeddingResult,
    });
  } catch (err) {
    logger.error(`Ingest failed for ${repoUrl}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const switchRepo = (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  try {
    const result = embeddingService.switchRepo(repoUrl);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const listRepos = (req, res) => {
  try {
    const repos = embeddingService.getStoredRepos();
    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { ingestRepo, switchRepo, listRepos };
