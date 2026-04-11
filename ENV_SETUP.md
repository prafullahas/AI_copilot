# Environment Setup Guide

This guide explains how to set up environment variables for the AI Codebase Copilot project.

## Backend Environment Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your actual values:
   ```env
   # Server Configuration
   PORT=5000

   # Authentication - Generate a secure random string
   JWT_SECRET=your_secure_jwt_secret_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_actual_openai_api_key_here
   OPENAI_BASE_URL=https://api.openai.com/v1

   # Application Configuration
   APP_URL=http://localhost:3000
   CORS_ORIGINS=http://localhost:3000
   ```

### Required Environment Variables

- **PORT**: Backend server port (default: 5000)
- **JWT_SECRET**: Secret key for JWT authentication (generate a secure random string)
- **OPENAI_API_KEY**: Your OpenAI API key for LLM functionality
- **OPENAI_BASE_URL**: OpenAI API base URL (optional, defaults to OpenAI)
- **APP_URL**: Frontend application URL
- **CORS_ORIGINS**: Allowed CORS origins (comma-separated if multiple)

## Frontend Environment Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your backend URL:
   ```env
   # API URL for backend
   VITE_API_URL=http://localhost:5000
   ```

### Required Environment Variables

- **VITE_API_URL**: Backend API URL (must include protocol and port)

## Security Notes

- **Never commit actual `.env` files** to version control
- **Generate a strong JWT secret** using a secure method
- **Keep your OpenAI API key secure** and never share it
- **Use different values** for development and production environments

## Generating a Secure JWT Secret

You can generate a secure JWT secret using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -base64 64

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Running the Application

1. Set up environment variables for both backend and frontend
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install
   ```
3. Start the development servers:
   ```bash
   # Backend (terminal 1)
   cd backend && npm start

   # Frontend (terminal 2)
   cd frontend && npm start
   ```

## Production Considerations

For production deployment:
- Use environment-specific values
- Set up proper CORS origins
- Use HTTPS URLs
- Consider using environment variable management tools
- Set up proper logging and monitoring
