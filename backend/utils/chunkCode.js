/**
 * chunkCode - Extracts meaningful code chunks (functions, classes) from source files.
 *
 * Supports: .js, .ts, .py, .java
 * Strategy: Language-aware pattern detection + scope tracking (braces or indentation).
 */

// --- Language-specific start patterns ---

const JS_TS_PATTERNS = [
  { type: 'function', regex: /^(?:export\s+)?(?:export\s+default\s+)?(?:async\s+)?function\s+\w+\s*\(/ },
  { type: 'function', regex: /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function/ },
  { type: 'function', regex: /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(.*\)\s*=>/ },
  { type: 'function', regex: /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\w+\s*=>/ },
  { type: 'class',    regex: /^(?:export\s+)?(?:export\s+default\s+)?class\s+\w+/ },
];

const PY_PATTERNS = [
  { type: 'function', regex: /^(?:async\s+)?def\s+\w+\s*\(/ },
  { type: 'class',    regex: /^class\s+\w+[\s(:]/ },
];

const JAVA_PATTERNS = [
  { type: 'class', regex: /^(?:public|private|protected)?\s*(?:abstract|final|static)?\s*class\s+\w+/ },
  { type: 'function', regex: /^(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?[\w<>\[\],\s]+\s+\w+\s*\(/ },
];

const getPatterns = (filePath) => {
  if (filePath.endsWith('.py')) return 'python';
  if (filePath.endsWith('.java')) return 'java';
  return 'js'; // .js and .ts share syntax
};

// --- Brace-delimited scope extraction (JS/TS/Java) ---

const extractBraceBlock = (lines, startIdx) => {
  const startLine = lines[startIdx];

  // Single-line expression (ends with ; and no opening brace) — e.g. arrow fn without body
  if (!startLine.includes('{') && startLine.trimEnd().endsWith(';')) {
    return startLine;
  }

  // Look for opening brace on start line or the very next line (for allman-style braces)
  let braceFoundWithin = false;
  const lookAhead = Math.min(startIdx + 2, lines.length);
  for (let k = startIdx; k < lookAhead; k++) {
    if (lines[k].includes('{')) { braceFoundWithin = true; break; }
  }
  if (!braceFoundWithin) {
    return startLine;
  }

  let depth = 0;
  let found = false;

  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; found = true; }
      if (ch === '}') { depth--; }
    }
    if (found && depth === 0) {
      return lines.slice(startIdx, i + 1).join('\n');
    }
  }
  return lines.slice(startIdx).join('\n');
};

// --- Indentation-based scope extraction (Python) ---

const extractIndentBlock = (lines, startIdx) => {
  const startLine = lines[startIdx];
  const baseIndent = startLine.search(/\S/);
  let endIdx = startIdx + 1;

  // Skip to the first line of the body
  while (endIdx < lines.length && lines[endIdx].trim() === '') endIdx++;
  if (endIdx >= lines.length) return startLine;

  const bodyIndent = lines[endIdx].search(/\S/);
  if (bodyIndent <= baseIndent) return startLine; // single-line def/class

  // Consume all lines that are either blank or deeper than base
  while (endIdx < lines.length) {
    const line = lines[endIdx];
    if (line.trim() === '') { endIdx++; continue; }
    const indent = line.search(/\S/);
    if (indent <= baseIndent) break;
    endIdx++;
  }

  return lines.slice(startIdx, endIdx).join('\n');
};

// --- Core chunker ---

/**
 * @param {string} content  - Raw source code
 * @param {string} filePath - Relative file path (used for language detection + output)
 * @returns {{ content: string, filePath: string, type: 'function' | 'class' }[]}
 */
const chunkCode = (content, filePath) => {
  const lang = getPatterns(filePath);
  const patterns = lang === 'python' ? PY_PATTERNS
    : lang === 'java' ? JAVA_PATTERNS
    : JS_TS_PATTERNS;

  const lines = content.split('\n');
  const chunks = [];
  const consumed = new Set(); // track lines already part of a chunk

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const trimmed = lines[i].trimStart();

    for (const pattern of patterns) {
      if (pattern.regex.test(trimmed)) {
        const block = lang === 'python'
          ? extractIndentBlock(lines, i)
          : extractBraceBlock(lines, i);

        const blockLineCount = block.split('\n').length;
        for (let j = i; j < i + blockLineCount; j++) consumed.add(j);

        chunks.push({
          content: block,
          filePath,
          type: pattern.type,
        });
        break; // first matching pattern wins for this line
      }
    }
  }

  return chunks;
};

module.exports = { chunkCode };
