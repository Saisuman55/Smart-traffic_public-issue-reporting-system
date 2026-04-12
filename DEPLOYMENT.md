# Deployment Guide

## Goal
Deploy the application backend on Render and keep Vercel as the public entry domain.

## 1) Push code
Push this repository to GitHub and make sure the branch to deploy contains your latest commits.

## 2) Deploy backend on Render
1. Open Render dashboard.
2. Create Blueprint from the repository.
3. Render will detect the render.yaml file and create:
   - evershop-app web service
   - evershop-db PostgreSQL instance
4. Wait for deployment to finish.
5. Open the Render app URL and complete first-time install if prompted.

## 3) Configure Vercel as reverse proxy
In your Vercel project settings:
1. Go to Project Settings -> Domains and attach your domain.
2. Add a rewrite rule:
   - Source: /(.*)
   - Destination: https://YOUR_RENDER_APP_URL/$1
3. Redeploy Vercel project.

## 4) Required checks
- Render app responds on root path.
- Admin and storefront load correctly.
- Product/media uploads persist in mounted disk at /app/media.

## 5) Optional hardening
- Add custom SENDGRID_API_KEY and other production secrets in Render env vars.
- Restrict database access.
- Add backups for PostgreSQL.
