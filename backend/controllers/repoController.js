const repoService = require('../services/repoService');
const embeddingService = require('../services/embeddingService');
const { chunkCode } = require('../utils/chunkCode');

const ingestRepo = async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  const githubPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
  if (!githubPattern.test(repoUrl)) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL' });
  }

  try {
    // 1. Clone + extract files
    const { repo, fileCount, files } = repoService.ingestRepo(repoUrl);

    // 2. Chunk all files
    const chunks = [];
    for (const file of files) {
      const fileChunks = chunkCode(file.content, file.path);
      chunks.push(...fileChunks);
    }

    // 3. Embed + store in FAISS (once, at ingestion)
    const embeddingResult = await embeddingService.embedAndStore(chunks);

    res.json({
      repo,
      fileCount,
      chunkCount: chunks.length,
      embeddings: embeddingResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { ingestRepo };
