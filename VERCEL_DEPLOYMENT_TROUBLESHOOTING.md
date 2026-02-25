# Vercel Deployment - Complete Troubleshooting & Deployment Checklist

## 🔴 ERROR: FUNCTION_INVOCATION_FAILED - ROOT CAUSE & FIX

### What This Error Means
The serverless function (your Express app) is crashing when Vercel tries to run it. This is NOT a code syntax error - it's a runtime issue.

### Root Causes (FIXED in new configuration)
✅ **FIXED**: `server.listen()` - Serverless functions can't start HTTP servers  
✅ **FIXED**: Missing `serverless-http` wrapper  
✅ **FIXED**: Incorrect file structure (was at root, now in `/api/index.js`)  
✅ **FIXED**: Socket.IO with persistent connections (removed)  
✅ **FIXED**: File uploads to local filesystem (now uses `/tmp`)  
✅ **FIXED**: Missing error handling and logging  

---

## 📋 DEPLOYMENT CHECKLIST

### ✅ Step 1: Update Dependencies Locally

```bash
cd backend
npm install
```

This installs `serverless-http` which wraps your Express app for Vercel.

### ✅ Step 2: Push Code to GitHub

```bash
cd ..
git add -A
git commit -m "Fix Vercel deployment: use serverless-http with /api folder structure"
git push origin main
```

### ✅ Step 3: Set Environment Variables in Vercel Dashboard

**Go to**: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/nirvaha?retryWrites=true&w=majority` | ✅ YES |
| `JWT_SECRET` | Generate a long random string (e.g., `your-super-secure-random-jwt-secret-key-2025`) | ✅ YES |
| `FRONTEND_URL` | `https://your-frontend-domain.netlify.app` | ✅ YES |
| `NODE_ENV` | `production` | ⚠️ Recommended |
| `DEBUG` | `false` | ⚠️ Set to `true` for debugging |

**How to add them:**
1. Click "Add New..."
2. Enter variable name in "Name" field
3. Enter value in "Value" field
4. Select which environments: "Production", "Preview", "Development"
5. Click "Add"
6. Repeat for all variables

### ✅ Step 4: Deploy to Vercel

**Option A: Automatic Deployment**
- Just push code to GitHub main branch
- Vercel automatically redeploys

**Option B: Manual Redeploy**
- Go to Vercel Dashboard → Your Project → Deployments
- Click "..." on the most recent deployment
- Select "Redeploy"

### ✅ Step 5: Monitor the Deployment

**In Vercel Dashboard:**
1. Go to Deployments tab
2. Watch status update from "Building" → "Ready"
3. If it says ❌ "Failed", click into it to see logs

**Expected flow:**
```
📦 Building...
   ✓ Build complete
🚀 Ready
   ✓ https://your-backend.vercel.app
```

---

## 🔍 HOW TO VIEW DEPLOYMENT LOGS

### Option 1: Vercel Dashboard (Recommended)

1. Go to **Vercel Dashboard** → **Your Project**
2. Click **Deployments** tab
3. Click on the deployment you want to check
4. Click **Logs** (top of page)
5. Look for errors or warnings

### Option 2: Real-time Function Logs

1. Go to **Settings** → **Functions**
2. Click on `/api/index.js`
3. See real-time logs as people use the API

### Option 3: Build Logs

During deployment, click "Build Logs" to see:
- Dependencies installation
- Any build-time errors
- Warnings

**What to look for:**
```javascript
[INFO] Initializing Express app { environment: 'production', ... }
[INFO] Attempting to connect to MongoDB...
[INFO] ✓ Connected to MongoDB Atlas
[INFO] ✓ Backend initialization complete
```

---

## 🧪 TEST YOUR DEPLOYMENT

### Test 1: Health Check

```bash
curl https://your-backend.vercel.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "environment": "production",
  "mongoConnected": true
}
```

### Test 2: API Health Check

```bash
curl https://your-backend.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "environment": "production",
  "mongoConnected": true,
  "message": "Nirvaha backend is running"
}
```

### Test 3: Login Endpoint

```bash
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nirvaha.com","password":"N1rv@h@Adm!n#2025@Secure"}'
```

**Expected response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Nirvaha Administrator",
    "email": "admin@nirvaha.com",
    "role": "admin"
  }
}
```

### Test 4: Test CORS

```bash
curl -X OPTIONS https://your-backend.vercel.app/api/health \
  -H "Origin: https://your-frontend.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Look for headers:**
```
Access-Control-Allow-Origin: https://your-frontend.netlify.app
Access-Control-Allow-Credentials: true
```

---

## 🐛 DEBUGGING FUNCTION_INVOCATION_FAILED

### If you STILL get FUNCTION_INVOCATION_FAILED after fixing:

#### Step 1: Enable Debug Logging

1. **In Vercel Dashboard:**
   - Settings → Environment Variables
   - Set `DEBUG=true`
   - Redeploy

2. **Check logs again:**
   - Go to Functions logs
   - Look for `[DEBUG]` lines
   - They'll show exactly what's failing

#### Step 2: Check MongoDB Connection

```bash
# Verify connection string is correct
curl https://your-backend.vercel.app/api/health
```

If `mongoConnected: false`, then:
- [ ] Check `MONGODB_URI` is set in Vercel dashboard
- [ ] Verify IP whitelist in MongoDB Atlas (allow 0.0.0.0/0)
- [ ] Test connection string locally first:
  ```bash
  # In backend folder
  node -e "
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ Connected'))
    .catch(err => console.error('✗ Error:', err.message));
  "
  ```

#### Step 3: Check Environment Variables

```bash
# In Vercel dashboard, go to Settings → Environment Variables
# Verify ALL these are set:
- MONGODB_URI ✓
- JWT_SECRET ✓
- FRONTEND_URL ✓
- NODE_ENV = "production" ✓
```

#### Step 4: Check File Structure

Verify your backend folder has:
```
backend/
├── api/
│   └── index.js          ← Main Vercel entry point
├── server.js             ← Keep for local development
├── package.json          ← Has serverless-http
├── vercel.json           ← Points to api/index.js
├── .vercelignore
└── .gitignore
```

#### Step 5: Increase Function Timeout

In `vercel.json`:
```json
"functions": {
  "api/index.js": {
    "maxDuration": 60,
    "memory": 1024
  }
}
```

**Note:** Higher timeout requires Pro plan. Free plan max is 10 seconds.

#### Step 6: Check for Missing Dependencies

```bash
# Verify all dependencies are in package.json
npm list
```

**Required packages:**
- ✓ express
- ✓ cors
- ✓ mongoose
- ✓ jsonwebtoken
- ✓ bcryptjs
- ✓ multer
- ✓ dotenv
- ✓ uuid
- ✓ serverless-http ← NEW

If any are missing:
```bash
npm install <package-name>
git add package.json
git commit -m "Add missing dependency"
git push
```

---

## 🎯 COMMON ISSUES & SOLUTIONS

### Issue: "Cannot find module 'serverless-http'"

**Solution:**
```bash
npm install serverless-http
git add package.json package-lock.json
git commit -m "Add serverless-http"
git push origin main
```

### Issue: CORS errors in frontend

**Solution:**
1. Verify `FRONTEND_URL` is set in Vercel environment variables
2. Use the EXACT domain (including https://)
3. Redeploy after changing

### Issue: "MONGODB_URI not set" error in logs

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `MONGODB_URI` with full connection string
3. Ensure it includes username, password, and database name
4. Click Redeploy

### Issue: Cold start is slow (> 5 seconds)

**Solution:**
This is normal for serverless. Cold starts happen when:
- First request after deployment
- No requests for 15+ minutes
- New deployment

To keep functions warm, you can:
- Use external uptime monitor to ping `/health` every 5 minutes
- Upgrade to Vercel Pro for better performance
- Optimize MongoDB connection pooling

### Issue: File uploads not working

**Reason:** Vercel's file system is read-only (except `/tmp`)

**Current fix:** We use `/tmp` for uploads (temporary)

**Long-term solutions:**
1. **Recommended:** Use Vercel Blob Storage
   ```bash
   npm install @vercel/blob
   ```

2. **Alternative:** Use cloud storage (AWS S3, Cloudinary, Google Cloud Storage)

3. **Temporary uploads:** Files in `/tmp` are cleared after function execution

---

## 📊 MONITORING & OBSERVABILITY

### Set up Vercel Analytics

1. Go to **Vercel Dashboard** → **Select Your Project**
2. Click **Analytics** tab
3. View:
   - Function execution time
   - Server response time
   - Error rate
   - Request volume

### Enable Error Tracking

1. Go to **Settings** → **Integrations**
2. Connect to error tracking service:
   - Sentry (recommended)
   - LogRocket
   - Datadog
   - New Relic

### Real-time Monitoring

Monitor logs in real-time:
```bash
# Using Vercel CLI
vercel logs <your-backend>

# Or in dashboard:
# Settings → Functions → /api/index.js → Logs (Real-time)
```

---

## 🚀 COMPLETE DEPLOYMENT WORKFLOW

```bash
# 1. Update dependencies
npm install

# 2. Test locally
npm run dev
curl http://localhost:5000/health

# 3. Push to GitHub
git add -A
git commit -m "Fix Vercel deployment"
git push origin main

# 4. Check Vercel Dashboard
# Deployments tab → Monitor status
# Look for ✓ "Ready"

# 5. Verify environment variables are set
# Settings → Environment Variables
# Check all required vars are present

# 6. Test production API
curl https://your-backend.vercel.app/api/health

# 7. Update frontend URL
# In frontend, change API_URL to new Vercel URL

# 8. Monitor logs
# Settings → Functions → Logs (Real-time)
```

---

## 📞 STILL HAVING ISSUES?

### Debugging Checklist

- [ ] Did you run `npm install` locally?
- [ ] Did you push to GitHub?
- [ ] Are environment variables set in Vercel dashboard?
- [ ] Did you redeploy after setting env vars?
- [ ] Are you using the correct MONGODB_URI?
- [ ] Is your IP whitelisted in MongoDB Atlas?
- [ ] Does `/api/index.js` exist in your repo?
- [ ] Does `vercel.json` point to `api/index.js`?
- [ ] Does `package.json` include `serverless-http`?

### Get Help

1. **Check Vercel Logs:**
   - Dashboard → Your Project → Functions → Logs
   - Look for error messages

2. **Enable Debug Mode:**
   - Settings → Environment Variables
   - Add `DEBUG=true`
   - Redeploy
   - Check logs again

3. **Reset Deployment:**
   - Settings → Danger Zone → Redeploy from Scratch
   - Choose latest deployment
   - Click Redeploy

4. **Contact Support:**
   - Vercel Status: https://www.vercel-status.com/
   - Vercel Discord: https://vercel.com/discord
   - GitHub Issues: https://github.com/vercel/vercel/issues/

---

## ✅ SUCCESS INDICATORS

Your deployment is working when you see:

```
✓ Deployment status: Ready
✓ Function logs show: "Backend initialization complete"
✓ /health endpoint returns: { "status": "ok" }
✓ /api/health endpoint returns: { "status": "ok", "message": "..." }
✓ Login endpoint returns JWT token
✓ Frontend can reach API without CORS errors
✓ MongoDB connection shows: mongoConnected: true
```

---

## 🎉 Congratulations!

Your Nirvaha backend is now ready for production on Vercel! 🚀

Next steps:
1. Update your frontend API URL to point to the new Vercel URL
2. Test all API endpoints with the frontend
3. Monitor logs for any runtime errors
4. Set up error alerts if needed
5. Create and test various user scenarios

---

**Last Updated:** February 25, 2026  
**Framework:** Express.js  
**Deployment:** Vercel Serverless Functions  
**Database:** MongoDB Atlas  
**Runtime:** Node.js 18.x
