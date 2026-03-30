# The Civic Authority

The Civic Authority is a smart traffic and public issue reporting system built for Indian civic workflows. Citizens can report road and infrastructure issues, and administrators can review, moderate, and track submissions through a React frontend backed by an Express and MongoDB API.

Live app: https://the-civic-authority-theta.vercel.app

GitHub repository: https://github.com/Saisuman55/Smart-traffic_public-issue-reporting-system

## Tech Stack

- React 19 + Vite
- TypeScript
- Express
- MongoDB + Mongoose
- Tailwind CSS 4
- Google Gemini integration for AI-assisted features

## Repository Layout

The root app is the primary runnable project:

- `src/`: frontend source used by the root Vite app
- `server.ts`: Express API entrypoint
- `src/routes`, `src/models`, `src/config`, `src/middleware`: backend API code
- `frontend/` and `backend/`: alternate split copies kept in the project, but the root package is the main path validated in this repository

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB instance, local or hosted

## Environment Variables

Create a local `.env` file from `.env.example` and set the values below:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
VITE_API_URL=http://localhost:3000
```

Notes:

- `JWT_SECRET` must be set in production. Do not reuse placeholder values.
- `VITE_API_URL` is optional for local development if you use the Vite proxy, but it should point at your deployed API in production.
- `.env`, `.env.local`, and other local env files are ignored by Git.

## Local Development

Install dependencies:

```bash
npm install
```

Run the API server:

```bash
npm run dev
```

In a second terminal, run the frontend:

```bash
npm run client
```

Open the app at `http://localhost:5173`.

## Validation

Type-check frontend and backend code:

```bash
npm run lint
```

Build the frontend bundle:

```bash
npm run build
```

Compile the backend:

```bash
npm run build:server
```

## Deployment Notes

- `render.yaml` is configured to read `JWT_SECRET` and `MONGODB_URI` from the deployment environment instead of storing secrets in the repository.
- `vercel.json` is included for SPA routing on Vercel.
- `railway.json` is included for Railway-based deployments.

## Publishing To GitHub

Initialize Git if needed:

```bash
git init
git add .
git commit -m "Initial commit"
```

Push to the existing GitHub repository:

```bash
git branch -M main
git remote add origin https://github.com/Saisuman55/Smart-traffic_public-issue-reporting-system.git
git push -u origin main
```
