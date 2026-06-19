# AI Client Billing Dispute Resolution Script

A modern AI-powered dispute resolution tool custom-built for **Avinash Kanaparthi Infra Private Limited**. This system enables the finance team to input disputed billing items and supporting evidence to automatically draft professional, structured dispute resolution response letters for client communication. This reduces billing escalation and accelerates invoice payment collections.

## Project Structure
- `/frontend` - Vite + React application with premium glassmorphism theme, templates, error handling, copy/export features, feedback/rating modules, and admin analytics dashboard.
- `/backend` - Node.js Express server with SQLite storage, supporting both live AI generation (Gemini/OpenAI) and fallback mock generation.
- `/docs` - Documentation including literature surveys, prompt templates evolution (v1-v4), and problem statement details.
- `/tests` - API tests and test-suite configurations.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Installation

1. **Configure Backend Environment**:
   Create a `.env` file inside the `backend` directory:
   ```env
   PORT=5000
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   *Note: If no API key is provided, the backend automatically runs in **Mock AI Mode**, generating realistic construction dispute letters locally for immediate demonstration.*

2. **Install Dependencies**:
   - For backend:
     ```bash
     cd backend
     npm install
     ```
   - For frontend:
     ```bash
     cd ../frontend
     npm install
     ```

3. **Run the Application**:
   - Start the Backend server:
     ```bash
     cd backend
     npm start
     ```
     (Runs on http://localhost:5000)

   - Start the Frontend dev server:
     ```bash
     cd frontend
     npm run dev
     ```
     (Runs on http://localhost:5173)

4. **Run Tests**:
   To execute the automated API validation:
   ```bash
   cd tests
   node run_tests.js
   ```
