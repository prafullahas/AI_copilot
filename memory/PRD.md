# AI Codebase Copilot - PRD

## Problem Statement
Create a clean backend project using Node.js (Express) for an AI codebase copilot with modular folder structure.

## Architecture
- **Runtime**: Node.js v20 with Express
- **Module System**: CommonJS
- **Port**: 8001 (supervisor-managed)
- **Route Prefix**: /api

## What's Been Implemented (Apr 9, 2026)
- Replaced FastAPI Python backend with Node.js Express
- Modular folder structure: routes/, controllers/, services/, utils/
- GET /api/health endpoint returning status, uptime, timestamp
- CORS middleware, 404 handler, error handler
- Simple logger utility
- POST /api/ingest-repo: clones GitHub repos (shallow), extracts .js/.ts/.py/.java files, ignores node_modules/dist/build, returns paths + content, auto-cleans temp dirs
- utils/chunkCode.js: Language-aware code chunker — extracts functions and classes using brace-tracking (JS/TS/Java) and indentation-tracking (Python)
- GET /api/info: Returns project name, version, available endpoints
- services/embeddingService.js: Local embeddings via @xenova/transformers (Xenova/all-MiniLM-L6-v2, 384-dim) + FAISS (faiss-node) vector storage. Embeds chunks once at ingestion time. Includes search() for retrieval.
- POST /api/retrieve: Semantic code search — converts query to embedding, searches FAISS, returns top-k chunks with content, file, relevance_score
- POST /api/chat: LLM-powered Q&A using GPT-4o-mini via Emergent proxy. Retrieves top 3 chunks, sends to LLM with strict context-only prompt, returns { answer, referencedFiles }
- services/llmService.js: Lazy-init OpenAI client, system prompt enforces context-only answers, 300 max_tokens, temperature 0

## Prioritized Backlog
- P0: AI logic integration (core copilot features)
- P1: MongoDB connection for persistence
- P1: Authentication layer
- P2: Additional routes (code analysis, suggestions)
- P2: Rate limiting, request validation
