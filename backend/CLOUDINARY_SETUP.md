# Cloudinary Setup for Persistent File Storage

## Why Cloudinary?

Render's filesystem is **ephemeral** - files uploaded to `/uploads` are deleted when:
- The server restarts
- A new deployment happens
- The dyno/container cycles

Cloudinary provides **persistent cloud storage** with a generous free tier:
- ✅ 25GB storage
- ✅ 25GB monthly bandwidth
- ✅ Free forever

## Setup Steps

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

After logging in:
1. Go to Dashboard (https://console.cloudinary.com/console)
2. Copy these values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Add to Backend .env

Add these to `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Install Dependencies

```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### 5. Deploy to Render

Add the environment variables in Render Dashboard:
1. Go to your backend service settings
2. Click "Environment"
3. Add:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 6. Redeploy

The code changes will automatically use Cloudinary when these env vars are present!

## How It Works

- **Uploads** → Stored in Cloudinary cloud
- **File URLs** → Direct Cloudinary URLs (e.g., `https://res.cloudinary.com/...`)
- **Persistence** → Files never disappear
- **Performance** → CDN-backed, fast worldwide
