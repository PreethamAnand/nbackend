// Vercel Serverless Entry Point
// This file runs on Vercel's serverless functions

const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

// ============================================
// LOGGING UTILITY
// ============================================
const logger = {
  info: (msg, data = "") => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
  error: (msg, error = "") => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error),
  warn: (msg, data = "") => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
  debug: (msg, data = "") => {
    if (process.env.DEBUG === "true") {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data);
    }
  },
};

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET =
  process.env.JWT_SECRET || "nirvaha-secret-key-please-change-in-production";

// Use /tmp for Vercel serverless (read-only file system)
// For local development, use ./uploads
const UPLOADS_DIR =
  process.env.VERCEL === "1"
    ? "/tmp/uploads"
    : path.join(__dirname, "../uploads");

logger.info("Initializing Express app", {
  environment: process.env.NODE_ENV || "development",
  isVercel: process.env.VERCEL === "1",
  uploadsDir: UPLOADS_DIR,
});

// Create uploads directory if it doesn't exist
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    logger.info("✓ Uploads directory created");
  }
} catch (error) {
  logger.warn("Could not create uploads directory", error.message);
}

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
  "https://nirvaha.netlify.app",
  "https://nirvaha.vercel.app",
].filter(Boolean);

const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only audio and image files are allowed."
        )
      );
    }
  },
});

// ============================================
// DATABASE SETUP
// ============================================
let mongoConnected = false;

// In-memory database for development
const localDB = {
  users: [],
  meditations: [],
  sounds: [],
  marketplaceRequests: [],
  marketplaceItems: [],
};

// Initialize local admin user
async function initLocalAdminUser() {
  const adminEmail = "admin@nirvaha.com";
  const adminExists = localDB.users.find((u) => u.email === adminEmail);

  if (!adminExists) {
    try {
      const adminPassword = "N1rv@h@Adm!n#2025@Secure";
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      localDB.users.push({
        id: uuidv4(),
        name: "Nirvaha Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        profile: {
          mobile: "+1-ADMIN-001",
          age: "",
          gender: "Not Specified",
          address: "Nirvaha Headquarters",
          education: "Administrator",
          healthCondition: "Not Applicable",
        },
      });

      logger.info("✓ Local admin user initialized");
    } catch (error) {
      logger.error("Failed to initialize local admin user", error.message);
    }
  }
}

// Database connection
async function connectMongo() {
  if (!MONGODB_URI) {
    logger.warn("MONGODB_URI not set. Using in-memory database", {
      note: "Set MONGODB_URI environment variable in Vercel dashboard",
    });
    mongoConnected = false;
    return;
  }

  try {
    logger.info("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    logger.info("✓ Connected to MongoDB Atlas");
    mongoConnected = true;
  } catch (error) {
    logger.error("MongoDB connection failed", error.message);
    logger.warn("Falling back to in-memory database");
    mongoConnected = false;
  }
}

// ============================================
// MONGOOSE SCHEMAS
// ============================================
const meditationSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    level: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, default: "Draft" },
    thumbnailUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const soundSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    title: { type: String, required: true },
    artist: { type: String, default: "" },
    frequency: { type: String, default: "" },
    duration: { type: Number, required: true },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, default: "Draft" },
    thumbnailUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    mood: { type: [String], default: [] },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profile: {
      mobile: { type: String, default: "" },
      age: { type: String, default: "" },
      gender: { type: String, default: "" },
      address: { type: String, default: "" },
      education: { type: String, default: "" },
      healthCondition: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const companionApplicationSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    title: { type: String, required: true },
    bio: { type: String, required: true },
    experience: { type: String, default: "" },
    location: { type: String, default: "" },
    languages: { type: String, default: "" },
    specialties: { type: String, default: "" },
    certifications: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    callRate: { type: Number, default: 0 },
    availability: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: { type: String, default: "" },
    whyJoin: { type: String, default: "" },
    status: { type: String, default: "pending" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const marketplaceItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    itemType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    status: { type: String, default: "available" },
    location: { type: String, default: "" },
    condition: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    contactInfo: { type: String, default: "" },
  },
  { timestamps: true }
);

const marketplaceRequestSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "" },
    urgency: { type: String, default: "normal" },
    budget: { type: Number, default: 0 },
    status: { type: String, default: "open" },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

// Create/Get Models
const Meditation =
  mongoose.models.Meditation || mongoose.model("Meditation", meditationSchema);
const Sound = mongoose.models.Sound || mongoose.model("Sound", soundSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);
const CompanionApplication =
  mongoose.models.CompanionApplication ||
  mongoose.model("CompanionApplication", companionApplicationSchema);
const MarketplaceItem =
  mongoose.models.MarketplaceItem ||
  mongoose.model("MarketplaceItem", marketplaceItemSchema);
const MarketplaceRequest =
  mongoose.models.MarketplaceRequest ||
  mongoose.model("MarketplaceRequest", marketplaceRequestSchema);

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();

// Error handling wrapper for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error("Route error", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  });
};

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(UPLOADS_DIR));

// ============================================
// MIDDLEWARE
// ============================================
const jwtAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn("JWT authentication failed", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

// ============================================
// HEALTH CHECK ROUTE
// ============================================
app.get("/health", (req, res) => {
  logger.info("Health check");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongoConnected: mongoConnected,
  });
});

app.get("/api/health", (req, res) => {
  logger.info("API health check");
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongoConnected: mongoConnected,
    message: "Nirvaha backend is running",
  });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================
app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      logger.debug("User registration attempt", { email });

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: "Name, email, and password are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      if (!mongoConnected) {
        const existingUser = localDB.users.find(
          (u) => u.email === email.toLowerCase()
        );
        if (existingUser) {
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
          id: uuidv4(),
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role || "user",
          profile: {
            mobile: "",
            age: "",
            gender: "",
            address: "",
            education: "",
            healthCondition: "",
          },
        };

        localDB.users.push(newUser);
        logger.info("User registered (local DB)", { email });

        const token = jwt.sign(
          { id: newUser.id, email: newUser.email, role: newUser.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.status(201).json({
          message: "User registered successfully",
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "user",
        profile: {
          mobile: "",
          age: "",
          gender: "",
          address: "",
          education: "",
          healthCondition: "",
        },
      });

      await newUser.save();
      logger.info("User registered (MongoDB)", { email });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      logger.error("Registration error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;

      logger.debug("Login attempt", { email });

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      if (!mongoConnected) {
        const user = localDB.users.find(
          (u) => u.email === email.toLowerCase()
        );
        if (!user) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        logger.info("User logged in (local DB)", { email });

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      logger.info("User logged in (MongoDB)", { email });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error("Login error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

app.get(
  "/api/auth/user/:id",
  asyncHandler(async (req, res) => {
    try {
      logger.debug("Fetching user", { userId: req.params.id });

      if (!mongoConnected) {
        const user = localDB.users.find((u) => u.id === req.params.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const { password, ...userData } = user;
        return res.json(userData);
      }

      const user = await User.findOne({ id: req.params.id });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userObj = user.toObject();
      delete userObj.password;

      res.json(userObj);
    } catch (error) {
      logger.error("User fetch error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

app.put(
  "/api/auth/user/:id",
  asyncHandler(async (req, res) => {
    try {
      const { name, profile } = req.body;

      logger.debug("Updating user", { userId: req.params.id });

      if (!mongoConnected) {
        const userIndex = localDB.users.findIndex(
          (u) => u.id === req.params.id
        );
        if (userIndex === -1) {
          return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = {
          ...localDB.users[userIndex],
          name: name || localDB.users[userIndex].name,
          profile: { ...localDB.users[userIndex].profile, ...profile },
        };

        localDB.users[userIndex] = updatedUser;

        const { password, ...userData } = updatedUser;
        return res.json(userData);
      }

      const updatedUser = await User.findOneAndUpdate(
        { id: req.params.id },
        { name, profile },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const userObj = updatedUser.toObject();
      delete userObj.password;

      logger.info("User updated", { userId: req.params.id });
      res.json(userObj);
    } catch (error) {
      logger.error("User update error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

// ============================================
// MEDITATION ROUTES (Placeholder)
// ============================================
app.get(
  "/api/meditations",
  asyncHandler(async (req, res) => {
    try {
      logger.debug("Fetching meditations");

      if (!mongoConnected) {
        return res.json(localDB.meditations);
      }

      const meditations = await Meditation.find();
      res.json(meditations);
    } catch (error) {
      logger.error("Meditation fetch error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

// ============================================
// SOUND ROUTES (Placeholder)
// ============================================
app.get(
  "/api/sounds",
  asyncHandler(async (req, res) => {
    try {
      logger.debug("Fetching sounds");

      if (!mongoConnected) {
        return res.json(localDB.sounds);
      }

      const sounds = await Sound.find();
      res.json(sounds);
    } catch (error) {
      logger.error("Sound fetch error", error.message);
      res.status(500).json({ error: error.message });
    }
  })
);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  logger.error("Global error handler", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.use((req, res) => {
  logger.warn("404 Not found", { path: req.path, method: req.method });
  res.status(404).json({ error: "Not found" });
});

// ============================================
// INITIALIZATION
// ============================================
(async () => {
  try {
    logger.info("Initializing Nirvaha backend...");
    await connectMongo();
    await initLocalAdminUser();
    logger.info("✓ Backend initialization complete");
  } catch (error) {
    logger.error("Initialization failed", error.message);
  }
})();

// ============================================
// EXPORT FOR VERCEL SERVERLESS
// ============================================
module.exports = serverless(app);
