# Nirvaha Backend

Express.js REST API backend for the Nirvaha wellness platform with MongoDB database.

## 🚀 Quick Start

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Server will run on**
   ```
   http://localhost:5000
   ```

## 📦 Deployment

### Deploy to Vercel (Recommended)

This backend is configured for easy deployment on Vercel! 

**📖 [View Complete Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)**

Quick deploy button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PreethamAnand/Nirvaha)

### Environment Variables for Production

Required environment variables:

- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT authentication
- `FRONTEND_URL` - Your frontend URL for CORS
- `NODE_ENV` - Set to `production`

## 🛠️ Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **CORS**: Enabled for frontend integration

## 📁 Project Structure

```
backend/
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
├── vercel.json         # Vercel deployment configuration
├── .env.example        # Environment variables template
├── .vercelignore       # Files to exclude from deployment
├── data/               # Local database (development only)
├── uploads/            # File uploads (use cloud storage in production)
└── scripts/            # Utility scripts
    └── migrate_sqlite_to_mongo.js
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user/:id` - Get user details
- `PUT /api/auth/user/:id` - Update user profile

### Meditations
- `GET /api/meditations` - Get all meditations
- `GET /api/meditations/:id` - Get meditation by ID
- `POST /api/meditations` - Create meditation (admin)
- `PUT /api/meditations/:id` - Update meditation (admin)
- `DELETE /api/meditations/:id` - Delete meditation (admin)
- `POST /api/meditations/upload` - Upload meditation files

### Sounds
- `GET /api/sounds` - Get all sounds
- `GET /api/sounds/:id` - Get sound by ID
- `POST /api/sounds` - Create sound (admin)
- `PUT /api/sounds/:id` - Update sound (admin)
- `DELETE /api/sounds/:id` - Delete sound (admin)
- `POST /api/sounds/upload` - Upload sound files

### Marketplace
- `GET /api/marketplace/items` - Get all marketplace items
- `GET /api/marketplace/items/:id` - Get item by ID
- `POST /api/marketplace/items` - Create item
- `PUT /api/marketplace/items/:id` - Update item
- `DELETE /api/marketplace/items/:id` - Delete item
- `POST /api/marketplace/requests` - Submit request
- `GET /api/marketplace/requests` - Get all requests (admin)

### Companion Applications
- `POST /api/companion/apply` - Submit companion application
- `GET /api/companion/applications` - Get all applications (admin)
- `PUT /api/companion/applications/:id` - Update application status (admin)

### File Uploads
- `POST /api/upload` - Upload images/audio files
- `GET /uploads/:filename` - Access uploaded files

## 🔐 Default Admin Credentials

**Development Mode:**
- Email: `admin@nirvaha.com`
- Password: `N1rv@h@Adm!n#2025@Secure`

⚠️ **Important**: In production, create your admin user through MongoDB and use a secure password!

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (12 rounds)
- CORS configuration
- Input validation
- Protected admin routes
- Secure file upload validation

## ⚠️ Important Notes for Production

### Socket.IO on Vercel
Socket.IO requires persistent connections which don't work well with Vercel's serverless architecture. Consider:
- Deploying Socket.IO on a separate platform (Heroku, Railway, Render)
- Using Vercel WebSocket support (Pro plan)
- Alternative real-time solutions (Firebase, Pusher, Ably)

### File Uploads on Vercel
Vercel serverless functions have read-only file systems. For production:
- Use Vercel Blob Storage (recommended)
- Integrate with AWS S3, Cloudinary, or similar
- Update multer configuration for cloud storage

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed solutions.

## 📊 Database Schema

### User Model
- id, name, email, password (hashed)
- role (user/admin)
- profile (mobile, age, gender, address, education, healthCondition)
- timestamps

### Meditation Model
- id, title, duration, level, category
- description, status
- thumbnailUrl, bannerUrl, audioUrl
- timestamps

### Sound Model
- id, title, artist, frequency, duration
- category, description, status
- thumbnailUrl, bannerUrl, audioUrl
- mood (array)
- timestamps

### Marketplace Item Model
- id, userId, userName, userEmail
- itemType, title, description, price
- status, location, condition
- imageUrl, contactInfo
- timestamps

### Companion Application Model
- id, fullName, email, phone, title
- bio, experience, location, languages
- specialties, certifications
- hourlyRate, callRate, availability
- profileImage, coverImage
- status (pending/approved/rejected)
- timestamps

## 🧪 Development Scripts

```bash
# Start server (production mode)
npm start

# Start server (development mode)
npm run dev

# Migrate SQLite to MongoDB
npm run migrate:sqlite

# Vercel production build
npm run vercel-build
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
1. Check your `MONGODB_URI` is correct
2. Whitelist your IP in MongoDB Atlas (0.0.0.0/0 for Vercel)
3. Verify database user credentials

### CORS Errors
1. Add your frontend URL to environment variables
2. Check `allowedOrigins` in server.js
3. Ensure credentials are properly configured

### File Upload Errors
1. Check file size limits (default: 50MB)
2. Verify allowed MIME types
3. Ensure uploads directory exists (local only)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Socket.IO Documentation](https://socket.io/docs/)

## 📝 License

Part of the Nirvaha wellness platform.

## 🤝 Support

For issues and questions, please check:
1. [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
2. API endpoint documentation above
3. Environment variables configuration

---

**Ready to deploy?** Check out the [Complete Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) 🚀
