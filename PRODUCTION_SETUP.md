# Production Setup Instructions

## Prerequisites

1. **Neon Account** - Sign up at https://neon.tech
2. **Vercel Account** - Sign up at https://vercel.com
3. **GitHub Account** - Already have one (Saisuman55)

## Environment Variables Required for Production

All these variables must be set in Vercel's Environment Variables section:

### Database
- `DATABASE_URL` - PostgreSQL connection string from Neon

### Authentication
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Usually `https://api.manus.im`
- `VITE_OAUTH_PORTAL_URL` - Usually `https://manus.im/oauth`
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`

### API Keys
- `BUILT_IN_FORGE_API_URL` - Manus API URL (usually `https://api.manus.im/forge`)
- `BUILT_IN_FORGE_API_KEY` - Server-side API key
- `VITE_FRONTEND_FORGE_API_URL` - Frontend API URL
- `VITE_FRONTEND_FORGE_API_KEY` - Client-side API key

### Owner Information
- `OWNER_OPEN_ID` - Your Manus OpenID
- `OWNER_NAME` - Your name

### Optional
- `VITE_ANALYTICS_ENDPOINT` - Analytics service endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Website ID for analytics
- `VITE_APP_TITLE` - App title (default: "The Civic Authority")
- `VITE_APP_LOGO` - Logo URL

## Step-by-Step Deployment

### 1. Create Neon Database

```bash
# Visit https://neon.tech and create account
# Create a new project
# Create a new database (default: neondb)
# Copy the connection string
```

### 2. Configure Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Choose `Saisuman55/Smart-traffic_public-issue-reporting-system`
5. Configure project:
   - **Framework**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 3. Add Environment Variables in Vercel

1. Go to Settings → Environment Variables
2. Add each variable from the list above
3. Set them for **Production** environment
4. Click "Save"

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://smart-traffic-system-xxx.vercel.app`

### 5. Run Database Migrations

After deployment, run migrations on production database:

**Option A: Using Neon Console**
1. Go to Neon dashboard
2. Open SQL Editor
3. Copy SQL from `drizzle/0001_*.sql`
4. Run the SQL

**Option B: Using Command Line**
```bash
DATABASE_URL="your_neon_connection_string" pnpm drizzle-kit migrate
```

### 6. Verify Deployment

Test these features:
- [ ] Homepage loads
- [ ] Login with Manus OAuth works
- [ ] Can report an issue
- [ ] Can upload photos
- [ ] Dashboard shows issues
- [ ] Admin panel accessible (if admin)
- [ ] Comments work
- [ ] Upvotes work

## Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Verify all dependencies are listed in package.json
- Check build logs in Vercel dashboard

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Neon IP allowlist
- Ensure migrations have been run

### OAuth Not Working
- Verify VITE_APP_ID is correct
- Check redirect URI: `https://your-domain/api/oauth/callback`
- Clear browser cookies

### File Upload Fails
- Verify BUILT_IN_FORGE_API_KEY is correct
- Check file size (max 50MB)
- Verify S3 bucket permissions

## Monitoring

### Vercel Logs
- View in Vercel dashboard → Deployments → Logs
- Check for errors and warnings

### Database Performance
- Monitor in Neon dashboard
- Check query performance
- Set up alerts for high CPU

## Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update OAuth redirect URI if needed

## Rollback

If deployment has issues:
1. Go to Vercel dashboard
2. Click on previous deployment
3. Click "Redeploy"

## Next Steps

1. Share deployment URL with team
2. Gather user feedback
3. Monitor analytics
4. Plan feature updates
5. Set up automated backups
