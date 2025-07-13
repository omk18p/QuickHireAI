# 🚀 Render Deployment Guide

## ✅ What We Fixed

Your server was failing because it was trying to manually read a `.env` file that doesn't exist on Render. We've updated the code to:

1. **Check if `.env` exists** before trying to read it
2. **Gracefully handle missing `.env`** on Render (where environment variables are set via the dashboard)
3. **Use Render's PORT** environment variable
4. **Add debugging endpoints** to verify environment variables

## 🧪 Test Locally First

Run this to test your environment variables locally:

```bash
cd Backend
node test-env.js
```

## 🌐 Deploy to Render

### Step 1: Set Environment Variables on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click the **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add these variables:

```
GEMINI_API_KEY = your_gemini_api_key_here
MONGODB_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_secret_here
NODE_ENV = production
```

### Step 2: Verify Deployment

After deployment, test these endpoints:

- **Health Check**: `https://your-app.onrender.com/api/test`
- **Environment Check**: `https://your-app.onrender.com/api/env-check`

### Step 3: Update Frontend

Update your frontend API base URL to point to your Render backend:

```javascript
// In Frontend/src/shared/services/api.js
const API_BASE_URL = 'https://your-app.onrender.com/api';
```

## 🔧 Troubleshooting

### If Environment Variables Are Missing

1. Check the `/api/env-check` endpoint
2. Verify variables are set in Render dashboard
3. Redeploy after adding variables

### If Database Connection Fails

1. Ensure `MONGODB_URI` is correct
2. Check if your MongoDB cluster allows connections from Render's IPs
3. Verify network access settings

### If Gemini API Fails

1. Verify `GEMINI_API_KEY` is valid
2. Check API quota and billing
3. Ensure the key has proper permissions

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret for JWT token signing | ✅ |
| `NODE_ENV` | Environment (production/development) | ❌ |
| `PORT` | Server port (set by Render) | ❌ |

## 🎯 Next Steps

1. **Test locally**: `node test-env.js`
2. **Deploy to Render** with environment variables
3. **Test endpoints** on Render
4. **Update frontend** API URL
5. **Deploy frontend** to Render or Vercel

## 🆘 Need Help?

- Check Render logs for detailed error messages
- Use the `/api/env-check` endpoint to debug environment variables
- Test locally first with `node test-env.js` 