# Vercel Deployment Guide

This guide will help you deploy your Kanban Board application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB Atlas cluster (free tier available)
3. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository

## Step 1: Prepare MongoDB Atlas

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier M0 is fine)
3. Create a database user (username and password)
4. Whitelist IP addresses (add `0.0.0.0/0` to allow all IPs, or your Vercel IPs)
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/kanban`)

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project root:
   ```bash
   cd /Users/macbookpro/Documents/sites/kanbanboard
   ```

4. Deploy:
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Select your account)
     - Link to existing project? **No** (first time) or **Yes** (subsequent deployments)
     - What's your project's name? (e.g., `kanbanboard`)
     - In which directory is your code located? **./** (root)

### Option B: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as root (`.`)
   - **Build Command**: Leave default (Vercel will auto-detect)
   - **Output Directory**: Leave default
   - **Install Command**: Leave default

## Step 3: Set Environment Variables

After deployment, set these environment variables in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kanban
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api
```

**Important Notes:**
- Replace `username` and `password` with your MongoDB Atlas credentials
- Replace `your-project.vercel.app` with your actual Vercel deployment URL
- For `NEXT_PUBLIC_API_URL`, use your Vercel URL (e.g., `https://kanbanboard.vercel.app/api`)

### How to Add Variables:

1. Click **Add New**
2. Enter the **Name** (e.g., `MONGODB_URI`)
3. Enter the **Value** (your connection string)
4. Select **Environment**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

## Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Step 5: Verify Deployment

1. Visit your Vercel URL (e.g., `https://kanbanboard.vercel.app`)
2. Check the health endpoint: `https://kanbanboard.vercel.app/api/health`
3. Test creating a board and tasks

## Troubleshooting

### MongoDB Connection Issues

- Verify your MongoDB Atlas connection string is correct
- Check that your IP is whitelisted (or use `0.0.0.0/0` for all IPs)
- Ensure your database user has proper permissions
- Check Vercel function logs for connection errors

### API Routes Not Working

- Verify `vercel.json` is in the project root
- Check that environment variables are set correctly
- Ensure `NEXT_PUBLIC_API_URL` points to your Vercel deployment URL

### Build Errors

- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

### CORS Issues

- The backend CORS is configured to allow all origins
- If issues persist, check `backend/server.js` CORS settings

## Project Structure

```
kanbanboard/
├── vercel.json          # Vercel configuration
├── backend/             # Express.js API
│   ├── server.js       # Main server (exports app for Vercel)
│   ├── config/
│   │   └── db.js       # MongoDB connection (serverless-optimized)
│   └── ...
└── frontend/            # Next.js application
    └── ...
```

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/kanban` |
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_API_URL` | Frontend API endpoint | `https://kanbanboard.vercel.app/api` |

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Happy Deploying! 🚀**

