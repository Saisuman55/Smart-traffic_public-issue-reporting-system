# The Civic Authority v2 - Deployment Guide

## Quick Start: Deploy to Vercel

### Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Create a new database (default name is `neondb`)
4. Copy the connection string (looks like: `postgresql://user:password@host/dbname`)

### Step 2: Prepare Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Manus OAuth (provided by Manus)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# JWT Secret (generate a strong random string)
JWT_SECRET=your_random_jwt_secret_here

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# Frontend Forge API (for client-side)
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key

# Owner Info
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Title and Logo
VITE_APP_TITLE=The Civic Authority
VITE_APP_LOGO=https://your-logo-url.png
```

### Step 3: Deploy to Vercel

1. **Connect GitHub Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose `Saisuman55/Smart-traffic_public-issue-reporting-system`

2. **Configure Build Settings:**
   - Framework: `Other`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

3. **Add Environment Variables:**
   - Go to Settings → Environment Variables
   - Add all variables from Step 2
   - Make sure to add them for Production environment

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your live URL will be provided (e.g., `https://smart-traffic-system.vercel.app`)

### Step 4: Run Database Migrations

After deployment, you need to run migrations on the production database:

```bash
# Connect to your production database
DATABASE_URL="postgresql://user:password@host/dbname" pnpm drizzle-kit migrate
```

Or use the Neon console to run the SQL migration directly:

1. Go to Neon console
2. Open SQL Editor
3. Copy the contents of `drizzle/0001_*.sql`
4. Run the SQL

### Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the following flows:
   - Login with Manus OAuth
   - Report an issue
   - Upload a photo
   - View the dashboard
   - Access admin panel (if admin user)

## Production Checklist

- [ ] Neon database created and connection string saved
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied to production
- [ ] GitHub repository connected to Vercel
- [ ] Deployment successful and live
- [ ] All authentication flows working
- [ ] File uploads working (S3 configured)
- [ ] Admin features accessible to admin users
- [ ] Error monitoring set up (optional: Sentry, DataDog)
- [ ] Domain configured (optional: custom domain)

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check Neon IP allowlist includes Vercel IPs
- Ensure database migrations have been run

### OAuth Not Working
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check redirect URI is set to `https://your-domain.vercel.app/api/oauth/callback`
- Ensure cookies are enabled in browser

### File Upload Not Working
- Verify `BUILT_IN_FORGE_API_KEY` is correct
- Check S3 bucket permissions
- Ensure file size is under 50MB

### Admin Panel Not Accessible
- Verify user has `role = 'admin'` in database
- Check JWT token is valid
- Clear browser cookies and re-login

## Scaling & Performance

### Database Optimization
- Add indexes on frequently queried columns (already done in schema)
- Monitor slow queries in Neon console
- Consider connection pooling for high traffic

### Frontend Optimization
- Enable Vercel Analytics
- Use Vercel's Image Optimization for uploaded photos
- Monitor Core Web Vitals

### Backend Optimization
- Enable caching headers for static assets
- Use Vercel's Edge Functions for API routes (optional)
- Monitor API response times

## Monitoring & Logging

### Vercel Logs
- View real-time logs in Vercel dashboard
- Check deployment logs for build errors
- Monitor function duration and memory usage

### Database Logs
- View query logs in Neon console
- Monitor connection count
- Set up alerts for high CPU usage

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel documentation: https://vercel.com/docs
3. Review Neon documentation: https://neon.tech/docs
4. Contact support through respective platforms

## Next Steps

After successful deployment:
1. Share the live URL with stakeholders
2. Gather user feedback
3. Monitor analytics and performance
4. Plan feature enhancements based on usage
5. Set up automated backups for database
6. Configure custom domain (if needed)
