const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

const ALLOWED_EXTENSIONS = new Set(['.js', '.ts', '.py', '.java']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.git']);

const cloneRepo = (repoUrl) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  try {
    execSync(`git clone --depth 1 ${repoUrl} ${tmpDir}`, {
      stdio: 'pipe',
      timeout: 60000,
    });
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Failed to clone repository: ${err.stderr?.toString() || err.message}`);
  }
  return tmpDir;
};

const walkDir = (dir, baseDir, results = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, results);
    } else if (ALLOWED_EXTENSIONS.has(path.extname(entry.name))) {
      const relativePath = path.relative(baseDir, fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      results.push({ path: relativePath, content });
    }
  }
  return results;
};

const ingestRepo = (repoUrl) => {
  logger.info(`Ingesting repo: ${repoUrl}`);
  const tmpDir = cloneRepo(repoUrl);
  try {
    const files = walkDir(tmpDir, tmpDir);
    logger.info(`Extracted ${files.length} code files`);
    return { repo: repoUrl, fileCount: files.length, files };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

module.exports = { ingestRepo };
