# The Civic Authority

The Civic Authority is a smart traffic and public issue reporting system built for Indian civic workflows. Citizens can report road and infrastructure issues, and administrators can review, moderate, and track submissions through a React frontend backed by an Express and MongoDB API.

Live app: https://the-civic-authority-theta.vercel.app

GitHub repository: https://github.com/Saisuman55/Smart-traffic_public-issue-reporting-system

## Overview

This project is designed as a civic issue intelligence platform rather than a plain complaint form. It combines public reporting, geolocation, image evidence, AI-assisted review, moderation workflows, and lightweight civic analytics in one application.

Typical use cases include:

- Reporting road damage, traffic hazards, sanitation problems, water issues, electrical faults, and other civic incidents
- Capturing photo evidence directly from camera or file upload
- Pinning the exact issue location on a map or using device geolocation
- Allowing administrators to verify, reject, resolve, or bulk-manage reports
- Keeping citizens updated through notifications, comments, and live status tracking
- Providing a simple AI assistant to guide users during reporting

## Key Features

### Citizen Features

- Secure sign up and sign in with JWT-based authentication
- Multi-step issue submission flow with photo, category, location, and description
- Map-based location picking with reverse geocoding
- Voice-to-text support for issue narration
- Personal profile management
- Notifications for status updates and community activity
- Upvotes and comment threads on reported issues
- Live feed, leaderboard, and issue detail views

### Admin Features

- Dedicated admin panel for report and user management
- Manual and AI-assisted review of submitted reports
- Status transitions across `Pending`, `Verified`, `In Progress`, `Resolved`, and `Rejected`
- Bulk moderation actions
- User role management and trust-score adjustments
- Broadcast notifications to all users
- Fake-report marking and moderation controls

### AI-Assisted Features

- AI image validation during report submission
- AI reasoning and confidence score stored with the issue
- AI chat assistant for civic guidance
- Audio transcription support for spoken issue descriptions

## How The App Works

### Citizen Reporting Flow

1. A user logs in and starts a new report.
2. The user uploads or captures an image of the issue.
3. The user selects the location on a map or uses current GPS position.
4. The user adds category, landmark, and narrative details.
5. The system optionally runs AI validation on the image and description.
6. The report is submitted to the backend and appears in the main issue feed.

### Review And Resolution Flow

1. Admins review incoming reports from the admin dashboard.
2. Reports can be verified, rejected, moved into progress, or resolved.
3. Users receive notifications when statuses change.
4. Community members can upvote and comment on reports to increase visibility and context.

## Main Screens

- `Dashboard`: issue feed, live statistics, filters, and map/grid views
- `ReportForm`: guided multi-step issue submission workflow
- `IssueDetails`: full issue context, comments, map, and timeline
- `Analytics`: category and status breakdowns for reports
- `AdminPanel`: moderation, user administration, AI audit, and broadcast tools
- `Chatbot`: AI assistant for civic-reporting help

## Tech Stack

- React 19 + Vite
- TypeScript
- Express
- MongoDB + Mongoose
- Tailwind CSS 4
- Google Gemini integration for AI-assisted features
- React Router for navigation
- Leaflet and React Leaflet for map experiences
- Recharts for analytics visualizations
- Sonner for toast notifications
- Motion for interface animation

## Architecture

The repository uses a single root application structure:

- The frontend is a Vite-powered React SPA in `src/`
- The backend API is an Express server started from `server.ts`
- MongoDB is accessed through Mongoose models in `src/models`
- API routes live in `src/routes`
- Shared configuration and middleware live in `src/config` and `src/middleware`

At runtime:

- The frontend calls `/api/...` endpoints
- In local development, Vite proxies API traffic to the Node server
- In deployed environments, `VITE_API_URL` can point the frontend to the hosted backend

## Repository Layout

The root app is the primary runnable project:

- `src/`: frontend source used by the root Vite app
- `server.ts`: Express API entrypoint
- `src/routes`, `src/models`, `src/config`, `src/middleware`: backend API code

Important frontend areas:

- `src/App.tsx`: route wiring and lazy-loaded screen composition
- `src/components/`: application screens and reusable UI
- `src/services/`: API, moderation, and AI service helpers
- `src/i18n.tsx` and `src/locales/`: translation and language support

## Data Model Summary

The app centers around two core entities:

- `User`: identity, role, profile fields, trust score, and activity metadata
- `Issue`: category, description, image, coordinates, address, status, comments, upvotes, AI reasoning, and confidence

Additional in-memory endpoints are used for:

- notifications
- app settings
- lightweight active-user statistics

## API Overview

Main backend endpoints include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/issues`
- `GET /api/issues/:id`
- `POST /api/issues`
- `PATCH /api/issues/:id`
- `DELETE /api/issues/:id`
- `POST /api/issues/:id/upvote`
- `POST /api/issues/:id/comment`
- `GET /api/users`
- `GET /api/users/:uid`
- `POST /api/users`
- `DELETE /api/users/:uid`
- `GET /api/notifications/:uid`
- `POST /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/stats`
- `GET /health`

## Why This Project Matters

Many public issue reporting systems fail because they are hard to use, lack location precision, do not build trust, and provide weak follow-up visibility. The Civic Authority addresses that by combining:

- evidence-first reporting
- location-aware issue capture
- transparent status progression
- admin moderation workflows
- AI-assisted triage and verification
- community participation through comments and upvotes

This makes the app suitable both as a civic-tech demo project and as a foundation for a more production-ready municipal reporting system.

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
- The live frontend is deployed at `https://the-civic-authority-theta.vercel.app`.

## Current Status

The repository is in a clean GitHub-ready state and currently includes:

- working frontend production build
- backend TypeScript validation
- Git-safe environment handling
- lazy-loaded frontend bundles for smaller initial load

Known area for future improvement:

- the frontend still has several heavy feature modules, so more fine-grained performance tuning is possible if needed

## Team Contributions

This project was developed as a team effort by:

| S.No. | Name | Registration No. | Contribution Area |
| --- | --- | --- | --- |
| 1 | Sai Suman Samantaray | 2301020565 | Project integration, GitHub setup, deployment configuration, repository cleanup, documentation, and overall coordination |
| 2 | Suvrajit Senapati | 2301020597 | Frontend UI development, dashboard views, navigation flow, and user experience polishing |
| 3 | Sanjay Kumar Sahoo | 2301020568 | Backend API development, database models, authentication routes, and server-side logic |
| 4 | Satya Spandan Rout | 2301020570 | Admin panel workflows, issue moderation features, analytics support, and report management tools |
| 5 | Rohan Anand | 2301020560 | AI-assisted features, chatbot integration, image validation flow, location-based reporting support, and testing assistance |

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
