# Render Deployment Guide (Backend)

Deploy the FastAPI backend to Render.com (or similar serverless container platforms).

## Prerequisites

1. Render.com account (https://render.com)
2. GitHub repository containing this code
3. Docker knowledge (Render builds from Dockerfile)

## Quick Deploy to Render

### Step 1: Connect GitHub Repository

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Connect your GitHub account and select this repo

### Step 2: Configure Service

- **Name**: `climate-hack` (or your preferred name)
- **Root Directory**: `fastapi_backend`
- **Runtime**: `Docker`
- **Build Command**: (leave blank or use default)
- **Start Command**: (leave blank, Render uses CMD from Dockerfile)
- **Plan**: Free tier is sufficient for testing; upgrade as needed

### Step 3: Environment Variables (Optional)

Add any required environment variables in Render dashboard:
- None required for basic operation
- Model files are bundled in repo

### Step 4: Deploy

Click **Create Web Service**. Render will:
1. Clone your repository
2. Build the Docker image
3. Deploy and provide a public URL (e.g., `https://climate-hack.onrender.com`)

Deployment typically takes 2-5 minutes.

## Verify Deployment

```bash
# Test health
curl https://climate-hack.onrender.com/health

# Test analysis
curl "https://climate-hack.onrender.com/analyze?company=NTPC.NS"

# Test ranking
curl "https://climate-hack.onrender.com/ranking"
```

## Frontend Integration

Set Vercel environment variable:

```env
VITE_API_URL=https://climate-hack.onrender.com
```

Frontend will automatically use this URL for API calls. If not set, defaults to Render URL in source code.

## Runtime Notes

- Render automatically uses the `PORT` environment variable (default 8000)
- Docker CMD in Dockerfile: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- CORS is enabled in backend for frontend integration
- Optional ML libraries (xgboost/lightgbm) are auto-detected

## Free Tier Limitations

- Services spin down after 15 minutes of inactivity (cold start ~30s on resume)
- Upgrade to Paid plan for always-on service
- Database storage is not included (not needed for this app)

## Troubleshooting

1. **503 Service Unavailable**:
   - Render service may be spinning up; wait 30 seconds and retry
   - Check Render dashboard logs for build/runtime errors

2. **404 on /analyze or /ranking**:
   - Verify backend is running (check Render dashboard)
   - Confirm frontend is using correct API URL

3. **Slow responses**:
   - Free tier services have limited resources
   - Model inference takes ~1-2 seconds; this is expected
   - Upgrade to Paid plan for better performance

4. **Build failures**:
   - Check Render build logs in dashboard
   - Ensure all required Python packages are in `requirements.txt`
   - Verify Dockerfile is present and valid

## Updating Backend

To deploy new code changes:

1. Commit and push to GitHub
2. Render will automatically detect the push and rebuild
3. Deployment typically takes 2-5 minutes
4. Use Render dashboard to view build progress and logs

## Render Dashboard

Monitor and manage your service at: https://dashboard.render.com

Key features:
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, requests
- **Deployments**: View deployment history
- **Settings**: Manage environment variables, auto-deploy, plan

## Notes

- Render free tier is great for development/testing
- Consider paid tier ($7-12/month) for production
- Service is deployed globally with CDN in front
