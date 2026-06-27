# Web Admin Deployment Guide

## Deploy to Render (Static Site)

### Option 1: Using Render Dashboard

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Static Site"
   - Connect your GitHub repository: `elysee12/inzira-app`

2. **Configure Build Settings**
   - **Name**: `imirire-web-admin` (or your preferred name)
   - **Root Directory**: `web_admin`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Environment Variables** (if needed)
   - Add any required environment variables in Render dashboard
   - Example: `VITE_API_BASE_URL=https://your-backend-api.com`

4. **Deploy**
   - Click "Create Static Site"
   - Render will automatically build and deploy

### Option 2: Using render.yaml (Blueprint)

The `render.yaml` file is already configured. Simply:

1. Push your code to GitHub
2. In Render Dashboard, click "New" → "Blueprint"
3. Select your repository
4. Render will detect `render.yaml` and configure automatically

### Redirect Rules

The `public/_redirects` file ensures all routes redirect to `index.html` for client-side routing.

```
/*    /index.html   200
```

This is automatically copied to the `dist` folder during build.

### Build Process

1. `npm run build` executes: `vite build && node postbuild.js`
2. TanStack Start builds to `.output/public`
3. `postbuild.js` copies `.output/public` → `dist`
4. `dist` folder is deployed to Render

### Local Testing

Test the build locally before deploying:

```bash
cd web_admin
npm install
npm run build
npm run preview
```

Visit `http://localhost:4173` to preview the built site.

### Troubleshooting

**Build fails with "dist does not exist"**
- Ensure `postbuild.js` runs successfully
- Check that `.output/public` is created by `vite build`

**Routes return 404**
- Verify `_redirects` file is in `public/` directory
- Check Render dashboard → Settings → Redirects/Rewrites

**API calls fail**
- Update `VITE_API_BASE_URL` environment variable
- Ensure CORS is configured on backend for your Render domain
