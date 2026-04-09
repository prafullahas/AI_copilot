/**
 * llmService - Generates answers from retrieved code chunks using GPT-4o-mini.
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

let client = null;

const getClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.EMERGENT_LLM_KEY,
      baseURL: process.env.INTEGRATION_PROXY_URL + '/llm',
      defaultHeaders: { 'X-App-ID': process.env.APP_URL },
    });
  }
  return client;
};

const SYSTEM_PROMPT = `You are a codebase copilot. Answer the user's question using ONLY the provided code context below. Be concise and reference specific files. If the answer is not found in the context, reply exactly: "Not found in codebase"`;

/**
 * @param {string} question - user question
 * @param {{ content: string, file: string, relevance_score: number }[]} chunks - top retrieved chunks (max 3)
 * @returns {{ answer: string, referencedFiles: string[] }}
 */
const generateAnswer = async (question, chunks) => {
  const topChunks = chunks.slice(0, 3);

  const context = topChunks
    .map((c, i) => `--- File: ${c.file} ---\n${c.content}`)
    .join('\n\n');

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
    max_tokens: 300,
    temperature: 0,
  });

  const answer = response.choices[0].message.content.trim();
  const referencedFiles = [...new Set(topChunks.map((c) => c.file))];

  logger.info(`LLM answer generated (${response.usage?.total_tokens || '?'} tokens)`);

  return { answer, referencedFiles };
};

module.exports = { generateAnswer };
