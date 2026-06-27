# Web Admin Deployment Guide

## Deploy to Render (Node.js Web Service with SSR)

**Important**: This web admin is built with TanStack Start which uses Server-Side Rendering (SSR). It must be deployed as a **Node.js Web Service**, not a static site.

### Option 1: Using Render Dashboard

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository: `elysee12/inzira-app`

2. **Configure Build Settings**
   - **Name**: `imirire-web-admin`
   - **Environment**: `Node`
   - **Root Directory**: `web_admin`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node .output/server/index.mjs`

3. **Environment Variables**
   - `NODE_ENV`: `production`
   - `PORT`: `3001` (or leave default)
   - `VITE_API_BASE_URL`: `https://your-backend-api.com` (if different from default)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - The service will run on a Node.js server with SSR

### Option 2: Using render.yaml (Blueprint)

The `render.yaml` file is already configured for Node.js deployment. Simply:

1. Push your code to GitHub
2. In Render Dashboard, click "New" → "Blueprint"
3. Select your repository
4. Render will detect `render.yaml` and configure automatically

### Build Process

1. `npm run build` executes `vite build`
2. TanStack Start builds to `.output/server/` (SSR server) and `.output/public/` (static assets)
3. Node.js server runs from `.output/server/index.mjs`
4. Server handles routing and SSR

### Local Testing

Test the build locally before deploying:

```bash
cd web_admin
npm install
npm run build
node .output/server/index.mjs
```

Visit the URL shown in the console (usually `http://localhost:3000`)

### Why Not Static Site?

TanStack Start uses:
- Server-Side Rendering (SSR) for better performance
- Server middleware for error handling
- Dynamic routing that requires a Node.js server

Deploying as a static site will result in a blank page because the JavaScript expects server-side rendering.

### Troubleshooting

**Blank page after deployment**
- Verify deployment type is "Web Service" not "Static Site"
- Check start command is `node .output/server/index.mjs`
- Review logs in Render dashboard for errors

**Build fails**
- Check build logs for specific errors
- Ensure Node.js version is compatible (18+)
- Verify all dependencies install correctly

**API calls fail**
- Update `VITE_API_BASE_URL` environment variable in Render
- Ensure CORS is configured on backend for your Render domain
- Check backend is accessible from Render servers
