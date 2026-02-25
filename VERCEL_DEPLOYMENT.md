# Nirvaha Backend - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

Your backend is now configured for seamless deployment on Vercel!

---

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **GitHub Repository**: Push your code to GitHub

---

## 🔧 Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Cluster**
   - Go to MongoDB Atlas and create a new cluster (free tier available)
   - Click "Connect" on your cluster

2. **Whitelist IP Addresses**
   - Go to "Network Access" in MongoDB Atlas
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for Vercel
   - Or add specific Vercel IPs if you prefer

3. **Create Database User**
   - Go to "Database Access"
   - Create a new database user with a strong password
   - Note down the username and password

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/nirvaha?retryWrites=true&w=majority`

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `backend` folder as the root directory

2. **Configure Project**
   - **Framework Preset**: Other (or leave as detected)
   - **Root Directory**: `backend`
   - **Build Command**: Leave as default or set to `npm run build`
   - **Output Directory**: Leave empty (using server.js directly)

3. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nirvaha?retryWrites=true&w=majority
   JWT_SECRET=your-super-secure-jwt-secret-key-change-this
   FRONTEND_URL=https://your-frontend-url.netlify.app
   NODE_ENV=production
   ```

   ⚠️ **Important**: Replace these with your actual values!

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (usually 1-2 minutes)
   - Copy your backend URL (e.g., `https://your-backend.vercel.app`)

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Backend Directory**
   ```bash
   cd backend
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add FRONTEND_URL
   vercel env add NODE_ENV
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## 🔗 Step 3: Update Frontend Configuration

Update your frontend to use the Vercel backend URL:

1. In your frontend `.env` or configuration:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

2. Update API calls to use this URL

---

## ✅ Step 4: Test Your Deployment

1. **Test Health Endpoint**
   - Visit: `https://your-backend.vercel.app/api/auth/login`
   - Should see the API response (or login page)

2. **Test Admin Login**
   - Use the admin credentials from your MongoDB or local setup
   - Email: `admin@nirvaha.com`
   - Password: (as set in your database)

3. **Test API Endpoints**
   - Try registering a new user
   - Test meditation/sound endpoints
   - Verify file uploads work

---

## ⚙️ Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ Yes | `mongodb+srv://user:pass@cluster.mongodb.net/nirvaha` |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ Yes | `your-super-secure-random-string-here` |
| `FRONTEND_URL` | Your frontend URL for CORS | ✅ Yes | `https://nirvaha.netlify.app` |
| `NODE_ENV` | Environment mode | ⚠️ Recommended | `production` |
| `PORT` | Server port (auto-managed by Vercel) | ❌ No | `5000` (ignored on Vercel) |

---

## 🔍 Important Notes

### Socket.IO Limitations on Vercel

⚠️ **Vercel Serverless Limitation**: Socket.IO requires persistent connections, which don't work well with serverless functions.

**Solutions:**
1. **Keep Socket.IO for local development only**
2. **Use Vercel WebSocket support** (Pro plan) - See [Vercel WebSocket docs](https://vercel.com/docs/functions/websockets)
3. **Deploy Socket.IO separately** on platforms like Heroku, Railway, or Render
4. **Use alternative real-time solutions**:
   - Firebase Realtime Database
   - Pusher
   - Ably
   - WebSocket via separate service

### File Upload Limitations

⚠️ **Serverless File System**: Vercel serverless functions have read-only file systems (except `/tmp`).

**Solutions:**
1. **Use Vercel Blob Storage** (Recommended)
   - Install: `npm install @vercel/blob`
   - See: [Vercel Blob docs](https://vercel.com/docs/storage/vercel-blob)

2. **Use Cloud Storage**:
   - AWS S3
   - Cloudinary
   - Google Cloud Storage
   - Azure Blob Storage

3. **Update multer configuration** to use cloud storage adapters

### Function Timeout

- **Hobby Plan**: 10 seconds timeout
- **Pro Plan**: 60 seconds timeout (configurable up to 300s)
- **Enterprise**: Up to 900 seconds

If you have long-running operations, consider:
- Upgrading to Pro plan
- Optimizing database queries
- Using background jobs for heavy tasks

---

## 🐛 Troubleshooting

### Issue: "Module not found" error
**Solution**: Make sure all dependencies are in `package.json` and reinstall:
```bash
npm install
vercel --prod
```

### Issue: CORS errors
**Solution**: 
1. Add your frontend URL to `FRONTEND_URL` environment variable
2. Check allowed origins in `server.js`
3. Redeploy after changes

### Issue: Database connection timeout
**Solution**:
1. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
2. Verify `MONGODB_URI` is correct in Vercel environment variables
3. Check MongoDB Atlas cluster status

### Issue: 404 on API routes
**Solution**:
1. Verify `vercel.json` configuration is present
2. Check that routes are defined correctly
3. Redeploy the project

### Issue: Environment variables not working
**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure variables are set for "Production" environment
3. Redeploy after adding variables

---

## 📊 Monitoring & Logs

1. **View Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on a deployment → View Logs

2. **Monitor Performance**
   - Vercel Dashboard → Analytics
   - Check function execution time, errors, bandwidth

3. **Set up Alerts**
   - Configure alerts for errors or downtime
   - Integrate with monitoring services

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Push to main branch** → Deploys to production
2. **Push to other branches** → Creates preview deployments
3. **Pull requests** → Automatic preview URLs

---

## 🚀 Performance Optimization

1. **Enable Edge Caching**
   - Add caching headers to static endpoints
   - Use Vercel's edge network

2. **Optimize Database Queries**
   - Use indexes in MongoDB
   - Implement pagination
   - Cache frequent queries

3. **Reduce Cold Starts**
   - Keep functions warm with periodic pings
   - Minimize dependencies
   - Use lightweight packages

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express on Vercel Guide](https://vercel.com/guides/using-express-with-vercel)

---

## 🎉 Success!

Your Nirvaha backend is now deployed on Vercel! 🌟

Your API will be available at: `https://your-project.vercel.app`

Remember to:
- ✅ Update frontend API URL
- ✅ Test all endpoints
- ✅ Monitor logs for errors
- ✅ Set up proper JWT secrets
- ✅ Configure CORS properly

---

## 📞 Need Help?

- Check [Vercel Community](https://github.com/vercel/vercel/discussions)
- Join [Vercel Discord](https://vercel.com/discord)
- Review [Vercel Status](https://www.vercel-status.com/)

Happy deploying! 🚀
