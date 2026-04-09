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

## Prioritized Backlog
- P0: AI logic integration (core copilot features)
- P1: MongoDB connection for persistence
- P1: Authentication layer
- P2: Additional routes (code analysis, suggestions)
- P2: Rate limiting, request validation
