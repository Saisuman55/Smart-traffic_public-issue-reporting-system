# Smart Traffic Public Issue Reporting System

> A civic platform that empowers citizens to report, track, and resolve local traffic and infrastructure issues in real time.

**Live demo:** https://smart-traffic-public-issue-reportin.vercel.app

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Authentication Setup](#authentication-setup)
   - [Google OAuth](#google-oauth-setup)
   - [Email OTP](#email-otp-setup)
   - [Manus OAuth](#manus-oauth-setup)
7. [Database Setup](#database-setup)
8. [Development Workflow](#development-workflow)
9. [Deployment to Vercel](#deployment-to-vercel)
10. [API Overview](#api-overview)
11. [Admin Account](#admin-account)
12. [Contributing](#contributing)
13. [License](#license)

---

## Project Overview

The **Smart Traffic Public Issue Reporting System** (also known as *The Civic Authority*) is a full-stack web application that lets residents report road damage, traffic hazards, sanitation problems, and other civic issues. Reports are geolocated on an interactive map, tracked through a transparent lifecycle (`pending → verified → in_progress → resolved`), and managed by administrators through a dedicated dashboard.

---

## Key Features

| Feature | Description |
|---|---|
| 🔐 Multi-method Authentication | Google OAuth 2.0, Email OTP, and Manus OAuth |
| 📍 Geolocated Reports | GPS-assisted location picker with reverse geocoding |
| 📸 Photo Evidence | Image upload (S3-compatible storage) |
| 📊 Admin Dashboard | Issue statistics, category breakdown, trust-score management |
| 💬 Community Engagement | Comments, upvotes, and real-time notifications |
| 🏆 Leaderboard | Top contributors ranked by verified reports |
| 🔔 Notifications | In-app alerts for status changes, comments, and upvotes |

---

## Architecture

```
┌─────────────────────────┐      tRPC / REST      ┌──────────────────────┐
│  React 19 (Vite)        │ ◀──────────────────▶  │  Express (Node.js)   │
│  TanStack Query         │                        │  tRPC router         │
│  Tailwind CSS v4        │                        │  JWT session auth    │
│  Radix UI / shadcn/ui   │                        │  Drizzle ORM         │
└─────────────────────────┘                        └──────────┬───────────┘
                                                              │
                                              MySQL (PlanetScale / local)
```

**Tech stack:**
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI (shadcn/ui), TanStack Query, wouter
- **Backend:** Express, tRPC 11, Jose (JWT), Drizzle ORM, mysql2
- **Database:** MySQL (compatible with PlanetScale serverless)
- **Auth:** Manus OAuth, Google OAuth 2.0, Email OTP (nodemailer / SMTP)
- **Storage:** AWS S3-compatible for image uploads
- **Deployment:** Vercel (serverless)

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`npm install -g pnpm`)
- MySQL database (local or cloud)

### Steps

```bash
# 1. Clone
git clone https://github.com/Saisuman55/Smart-traffic_public-issue-reporting-system.git
cd Smart-traffic_public-issue-reporting-system

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Push database schema
pnpm db:push

# 5. Start development server
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values described below.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing session JWTs |
| `GOOGLE_CLIENT_ID` | For Google auth | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | For Google auth | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | For Google auth | e.g. `http://localhost:3000/api/oauth/google/callback` |
| `SMTP_HOST` | For Email OTP | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | For Email OTP | e.g. `587` |
| `SMTP_USER` | For Email OTP | Your Gmail/SMTP username |
| `SMTP_PASSWORD` | For Email OTP | App password (not your regular password) |
| `SMTP_FROM_EMAIL` | For Email OTP | From address shown in OTP emails |
| `ADMIN_EMAIL` | ✅ | Email auto-promoted to `admin` role on first sign-in |
| `OAUTH_SERVER_URL` | For Manus auth | Manus OAuth server base URL |
| `VITE_OAUTH_PORTAL_URL` | For Manus auth | Manus portal URL (client-side) |
| `VITE_APP_ID` | For Manus auth | Manus application ID |
| `PORT` | Optional | Server port (default `3000`) |
| `NODE_ENV` | Optional | `development` or `production` |

---

## Authentication Setup

The application supports **three authentication methods**. All methods ultimately set a signed JWT session cookie.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or select an existing one).
2. Navigate to **APIs & Services → OAuth consent screen** and configure it.
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs**.
4. Set Application type to **Web application**.
5. Add `http://localhost:3000/api/oauth/google/callback` (dev) and your Vercel URL (prod) to **Authorised redirect URIs**.
6. Copy the **Client ID** and **Client Secret** to your `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
   ```

The Google login button on `/login` will redirect through `/api/oauth/google` which builds the correct consent-screen URL at runtime.

### Email OTP Setup

Any SMTP server works. Gmail is the easiest option:

1. Enable 2-Factor Authentication on your Google account.
2. Go to **Google Account → Security → App passwords** and generate a password for "Mail".
3. Set in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=generated-app-password
   SMTP_FROM_EMAIL=noreply@your-domain.com
   ```

In development, if `SMTP_USER` is not set, OTPs are printed to the console instead of being emailed.

### Manus OAuth Setup

1. Register your application in the Manus developer portal to get `VITE_APP_ID`.
2. Configure the OAuth server URL:
   ```
   OAUTH_SERVER_URL=https://oauth-portal.example.com
   VITE_OAUTH_PORTAL_URL=https://oauth-portal.example.com
   VITE_APP_ID=your-app-id
   ```

---

## Database Setup

The project uses **Drizzle ORM** with MySQL. Run migrations with:

```bash
pnpm db:push   # generates SQL and applies migrations
```

For PlanetScale or other serverless MySQL providers, use the `DATABASE_URL` in the `mysql://` format.

---

## Development Workflow

```bash
pnpm dev       # start dev server with hot reload (port 3000)
pnpm build     # build client + bundle server for production
pnpm start     # start production server (after build)
pnpm check     # TypeScript type check
pnpm test      # run vitest tests
pnpm format    # format code with Prettier
```

---

## Deployment to Vercel

### First-time setup

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts.

### Environment variables in Vercel

In your Vercel project settings (**Settings → Environment Variables**), add all variables from `.env.example`:

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - Set `GOOGLE_REDIRECT_URI` to `https://your-app.vercel.app/api/oauth/google/callback`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
- `ADMIN_EMAIL`
- `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` (if using Manus)

### Deploy

```bash
vercel --prod
```

The `vercel.json` at the root configures build commands, rewrites, and security headers automatically.

---

## API Overview

The backend exposes a [tRPC](https://trpc.io/) API at `/api/trpc`. Procedures:

| Router | Procedure | Auth | Description |
|---|---|---|---|
| `auth` | `me` | Public | Get current user |
| `auth` | `logout` | Public | Clear session cookie |
| `auth` | `requestOtp` | Public | Send OTP to email |
| `auth` | `verifyOtp` | Public | Verify OTP, set session |
| `issues` | `list` | Public | List issues with filters |
| `issues` | `getById` | Public | Get single issue |
| `issues` | `create` | 🔐 User | Create new issue |
| `issues` | `updateStatus` | 🛡 Admin | Update issue status |
| `comments` | `list` | Public | Get issue comments |
| `comments` | `create` | 🔐 User | Post a comment |
| `comments` | `delete` | 🔐 User/Admin | Delete a comment |
| `upvotes` | `toggle` | 🔐 User | Toggle upvote |
| `upvotes` | `hasUpvoted` | 🔐 User | Check upvote status |
| `users` | `getProfile` | Public | Get user profile |
| `users` | `updateProfile` | 🔐 User | Update own profile |
| `users` | `getLeaderboard` | Public | Top contributors |
| `notifications` | `list` | 🔐 User | User notifications |
| `notifications` | `markAsRead` | 🔐 User | Mark as read |
| `notifications` | `send` | 🛡 Admin | Send notification |
| `admin` | `getStats` | 🛡 Admin | Issue statistics |
| `admin` | `getCategoryBreakdown` | 🛡 Admin | Category counts |
| `admin` | `getTopContributors` | 🛡 Admin | Contributor list |
| `admin` | `adjustTrustScore` | 🛡 Admin | Change user trust |

REST endpoints (non-tRPC):

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/oauth/callback` | Manus OAuth callback |
| `GET` | `/api/oauth/google` | Redirect to Google consent screen |
| `GET` | `/api/oauth/google/callback` | Google OAuth callback |
| `POST` | `/api/upload` | Image upload (binary body) |

---

## Admin Account

The admin email is configured via the `ADMIN_EMAIL` environment variable (default: `saisumansamantaray184@gmail.com`).

When this email signs in for the first time — via Google OAuth, Email OTP, or Manus — the account is **automatically assigned the `admin` role**, gaining access to:

- Issue status management
- Admin statistics dashboard
- Trust score adjustment
- Sending custom notifications

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests where appropriate.
4. Run `pnpm check && pnpm test` to ensure nothing is broken.
5. Open a pull request with a clear description of the change.

Please follow the existing code style (enforced by Prettier – run `pnpm format`).

---

## License

This project is licensed under the **MIT License**.

---

*For questions or feedback, open an issue on GitHub.*
