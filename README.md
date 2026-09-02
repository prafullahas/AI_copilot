# AI Copilot

A full-stack AI developer assistant that allows users to connect a GitHub repository, search its codebase, and interact with an AI copilot using contextual information from the repository.

## 🚀 Features

* **GitHub Repository Ingestion** — Load and process repository content for AI-assisted interaction.
* **AI-Powered Chat** — Ask questions about the codebase using a conversational interface.
* **Semantic Search** — Find relevant code and repository context based on natural-language queries.
* **Persistent Memory** — Maintain relevant conversation context across interactions.
* **JWT Authentication** — Secure user registration, login, and protected application routes.
* **Full-Stack Architecture** — React frontend with a Node.js/Express backend.
* **Automated Testing** — Tests for authentication and backend functionality.

## 🏗️ Architecture

```text
                    ┌─────────────────┐
                    │   React Client  │
                    │    Frontend     │
                    └────────┬────────┘
                             │
                         REST API
                             │
                    ┌────────▼────────┐
                    │ Node.js /       │
                    │ Express Backend │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        GitHub Repo      AI Services     Memory
         Ingestion       & Search       / Context
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                       AI Copilot
```

## 🛠️ Tech Stack

**Frontend**

* React
* JavaScript
* Tailwind CSS
* shadcn/ui
* Axios

**Backend**

* Node.js
* Express.js
* REST APIs
* JWT Authentication

**AI / Search**

* LLM-based code assistance
* Repository ingestion
* Semantic search
* Contextual conversation memory

**Testing & Tools**

* Git
* GitHub
* Jest / Node.js testing tools
* Python-based test utilities

## 📁 Project Structure

```text
AI_copilot/
│
├── backend/          # API, authentication, services and routes
├── frontend/         # React application
├── memory/           # Conversation/context memory
├── tests/             # Automated tests
├── test_reports/      # Test results and reports
├── ENV_SETUP.md       # Environment configuration
├── package.json
└── README.md
```

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/prafullahas/AI_copilot.git
cd AI_copilot
```

### 2. Configure environment variables

Follow [`ENV_SETUP.md`](ENV_SETUP.md) to configure the required environment variables for the frontend and backend.

### 3. Install dependencies

Install the dependencies for both the frontend and backend:

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```

### 4. Start the application

Start the backend and frontend using their respective development commands.

Refer to the individual `package.json` files for the available scripts.

## 🌐 Demo

**Live Application:**
https://ai-copilot-sigma.vercel.app/


## 🔮 Future Improvements

* Improve repository understanding for larger codebases
* Add more advanced code-aware retrieval
* Improve conversational memory and context management
* Add support for additional repository providers
* Add automated CI/CD testing and deployment



GitHub: https://github.com/prafullahas

