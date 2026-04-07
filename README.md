# Smart Traffic Public Issue Reporting System

A production-ready civic platform for citizens to report, track, and resolve local infrastructure issues — from potholes to power outages.

## Overview

Built with **React 19 + Express + tRPC + MySQL (Drizzle ORM)**, this system enables:

- Citizens to submit geo-tagged issue reports with photo evidence
- Community upvoting and commenting on issues
- Administrators to triage, verify, and resolve issues
- Analytics dashboards showing city-wide civic metrics
- Trust score system rewarding active contributors

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Wouter |
| Backend | Express, tRPC, TypeScript |
| Database | MySQL via Drizzle ORM |
| Auth | OAuth (Manus) + JWT cookies |
| File Storage | AWS S3-compatible (Manus Forge) |
| Build | Vite + esbuild |
| Testing | Vitest |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- MySQL database (local or [Neon](https://neon.tech))

### 1. Clone and install

```bash
git clone https://github.com/Saisuman55/Smart-traffic_public-issue-reporting-system.git
cd Smart-traffic_public-issue-reporting-system
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

See [Environment Variables](#environment-variables) for details on each variable.

### 3. Set up the database

```bash
pnpm db:push
```

### 4. Start the development server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Development Setup

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm check` | TypeScript type checking |
| `pnpm test` | Run Vitest test suite |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Generate and apply DB migrations |

### Project Structure

```
.
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── pages/   # Route-level page components
│   │   ├── components/  # Shared UI components
│   │   ├── hooks/   # Custom React hooks
│   │   └── lib/     # Utilities and tRPC client
├── server/          # Express backend
│   ├── _core/       # Auth, env, tRPC setup, OAuth
│   ├── db.ts        # Database query helpers
│   ├── routers.ts   # tRPC router definitions
│   └── *.test.ts    # Vitest tests
├── shared/          # Types shared between client/server
├── drizzle/         # DB schema & migrations
├── vercel.json      # Vercel deployment config
└── vite.config.ts   # Vite build config
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MySQL connection string (e.g., Neon) |
| `JWT_SECRET` | ✅ | Strong random string for session encryption |
| `VITE_APP_ID` | ✅ | OAuth application ID from Manus |
| `OAUTH_SERVER_URL` | ✅ | OAuth server URL (e.g., `https://api.manus.im`) |
| `BUILT_IN_FORGE_API_URL` | ✅ | Manus Forge API URL for file storage |
| `BUILT_IN_FORGE_API_KEY` | ✅ | Manus Forge API key |
| `OWNER_OPEN_ID` | ✅ | Manus OpenID of the first admin user |
| `OWNER_NAME` | ✅ | Display name for the first admin user |

## Deployment

### Deploy to Vercel

1. **Create a MySQL database** on [Neon](https://neon.tech) (free tier available).

2. **Import this repo** into your Vercel project.

3. **Add environment variables** in the Vercel dashboard (Settings → Environment Variables) for all variables listed above.

4. **Run database migrations** once after the first deploy:

   ```bash
   DATABASE_URL="your_neon_url" pnpm db:push
   ```

5. **Redeploy** to pick up the migrated schema.

The `vercel.json` in the root already configures rewrites to route all requests through the Express server.

### Production Build Locally

```bash
pnpm build
NODE_ENV=production pnpm start
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

The test suite uses **Vitest** and covers:

- Authentication flows (login/logout)
- Issue CRUD operations
- Admin moderation
- Community features (comments, upvotes)
- User management
- Form validation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT
