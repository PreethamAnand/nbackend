const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;const MONGO_URI = process.env.MONGO_URI;

const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
    fileSize: 50 * 1024 * 1024,
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
        new Error("Invalid file type. Only audio and image files are allowed."),
      );
    }
  },
});

if (!MONGO_URI) {
  console.error("WARNING: MONGO_URI missing");
} else {
  console.log("MONGO_URI detected");
}

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

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
  { timestamps: true },
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
  { timestamps: true },
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
  { timestamps: true },
);

const Meditation = mongoose.model("Meditation", meditationSchema);
const Sound = mongoose.model("Sound", soundSchema);
const CompanionApplication = mongoose.model(
  "CompanionApplication",
  companionApplicationSchema,
);

async function seedMongo() {
  const meditationCount = await Meditation.countDocuments();
  if (meditationCount === 0) {
    await Meditation.insertMany([
      {
        title: "Morning Mindfulness",
        duration: 15,
        level: "Beginner",
        category: "Mindfulness",
        description: "Start your day with clarity and peace.",
        status: "Active",
      },
      {
        title: "Deep Sleep Meditation",
        duration: 30,
        level: "Intermediate",
        category: "Sleep",
        description: "Relax and prepare for restful sleep.",
        status: "Active",
      },
      {
        title: "Stress Relief Session",
        duration: 20,
        level: "Beginner",
        category: "Stress",
        description: "Release tension and find inner calm.",
        status: "Draft",
      },
    ]);
  }

  const soundCount = await Sound.countDocuments();
  if (soundCount === 0) {
    await Sound.insertMany([
      {
        title: "Tibetan Singing Bowls",
        artist: "Sacred Sounds Collective",
        frequency: "432 Hz",
        duration: 15,
        category: "Bowl Therapy",
        description: "Ancient healing vibrations from the Himalayas.",
        status: "Active",
        mood: ["Calm", "Healing", "Relaxation"],
      },
      {
        title: "Ocean Waves & Rain",
        artist: "Nature Symphony",
        frequency: "528 Hz",
        duration: 20,
        category: "Nature Sounds",
        description: "Soothing symphony of ocean waves and gentle rainfall.",
        status: "Active",
        mood: ["Peaceful", "Natural", "Meditative"],
      },
      {
        title: "Theta Binaural Beats",
        artist: "NeuroSound Lab",
        frequency: "639 Hz",
        duration: 30,
        category: "Binaural",
        description: "Frequencies for deep meditation and clarity.",
        status: "Active",
        mood: ["Focus", "Calm"],
      },
    ]);
  }
}
const app = express();
app.set("trust proxy", 1);
const allowedOrigins = ["http://localhost:3000", "https://nfr-mu.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));
app.get("/", (req, res) => {
  res.json({ message: "Nirvaha backend is running 🚀" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ error: "File upload failed", message: error.message });
  }
});



function splitList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toAdminCompanion(app) {
  return {
    id: app.id,
    name: app.fullName,
    email: app.email,
    expertise: app.title,
    specialties: splitList(app.specialties),
    languages: splitList(app.languages),
    rating: 0,
    status: app.status || "pending",
    appliedDate: app.submittedAt
      ? new Date(app.submittedAt).toISOString().split("T")[0]
      : "",
    bio: app.bio || "",
    profileImage: app.profileImage || "",
    coverImage: app.coverImage || "",
    location: app.location || "",
    pricing: {
      chat: Number.isFinite(app.callRate) ? app.callRate : 0,
      video: Number.isFinite(app.hourlyRate) ? app.hourlyRate : 0,
    },
    availability: splitList(app.availability),
  };
}

function toPublicCompanion(app) {
  return {
    id: app.id,
    name: app.fullName,
    title: app.title,
    avatar: app.profileImage || "",
    coverImage: app.coverImage || "",
    availability: app.availability || "Available",
    rating: 4.8,
    reviews: 0,
    sessions: 0,
    location: app.location || "",
    bio: app.bio || "",
    specialties: splitList(app.specialties),
    hourlyRate: app.hourlyRate || 0,
    callRate: app.callRate || 0,
  };
}

app.get("/api/companion-applications", async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  const applications = await CompanionApplication.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  res.json(applications.map(toAdminCompanion));
});

app.get("/api/companion-applications/:id", async (req, res) => {
  const { id } = req.params;
  const application = await CompanionApplication.findOne({ id }).lean();
  if (!application) {
    return res.status(404).json({ error: "application not found" });
  }
  res.json({
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    title: application.title,
    bio: application.bio,
    experience: application.experience,
    location: application.location,
    languages: application.languages,
    specialties: application.specialties,
    certifications: application.certifications,
    hourlyRate: application.hourlyRate,
    callRate: application.callRate,
    availability: application.availability,
    profileImage: application.profileImage,
    coverImage: application.coverImage,
    website: application.website,
    socialLinks: application.socialLinks,
    whyJoin: application.whyJoin,
    status: application.status,
    submittedAt: application.submittedAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  });
});

app.post("/api/companion-applications", async (req, res) => {
  const payload = req.body || {};
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "title",
    "bio",
    "experience",
    "location",
    "languages",
    "specialties",
    "hourlyRate",
    "callRate",
    "whyJoin",
  ];
  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      fields: missing,
    });
  }

  const application = await CompanionApplication.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    title: payload.title,
    bio: payload.bio,
    experience: payload.experience,
    location: payload.location,
    languages: payload.languages,
    specialties: payload.specialties,
    certifications: payload.certifications || "",
    hourlyRate: Number(payload.hourlyRate) || 0,
    callRate: Number(payload.callRate) || 0,
    availability: payload.availability || "",
    profileImage: payload.profileImage || "",
    coverImage: payload.coverImage || "",
    website: payload.website || "",
    socialLinks: payload.socialLinks || "",
    whyJoin: payload.whyJoin,
    status: "pending",
    submittedAt: new Date(),
  });

  res.status(201).json({
    id: application.id,
    status: application.status,
    submittedAt: application.submittedAt,
  });
});

app.put("/api/companion-applications/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};

  const updated = await CompanionApplication.findOneAndUpdate(
    { id },
    {
      ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
      ...(payload.name !== undefined ? { fullName: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.expertise !== undefined ? { title: payload.expertise } : {}),
      ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
      ...(payload.experience !== undefined
        ? { experience: payload.experience }
        : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.languages !== undefined
        ? { languages: payload.languages }
        : {}),
      ...(payload.specialties !== undefined
        ? { specialties: payload.specialties }
        : {}),
      ...(payload.certifications !== undefined
        ? { certifications: payload.certifications }
        : {}),
      ...(payload.hourlyRate !== undefined
        ? { hourlyRate: Number(payload.hourlyRate) || 0 }
        : {}),
      ...(payload.callRate !== undefined
        ? { callRate: Number(payload.callRate) || 0 }
        : {}),
      ...(payload.pricingChat !== undefined
        ? { callRate: Number(payload.pricingChat) || 0 }
        : {}),
      ...(payload.pricingVideo !== undefined
        ? { hourlyRate: Number(payload.pricingVideo) || 0 }
        : {}),
      ...(payload.availability !== undefined
        ? { availability: payload.availability }
        : {}),
      ...(payload.profileImage !== undefined
        ? { profileImage: payload.profileImage }
        : {}),
      ...(payload.coverImage !== undefined
        ? { coverImage: payload.coverImage }
        : {}),
      ...(payload.website !== undefined ? { website: payload.website } : {}),
      ...(payload.socialLinks !== undefined
        ? { socialLinks: payload.socialLinks }
        : {}),
      ...(payload.whyJoin !== undefined ? { whyJoin: payload.whyJoin } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
    },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "application not found" });
  }

  res.json(toAdminCompanion(updated));
});

app.patch("/api/companion-applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  const updated = await CompanionApplication.findOneAndUpdate(
    { id },
    { status },
    { new: true, runValidators: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "application not found" });
  }

  res.json(toAdminCompanion(updated));
});

app.delete("/api/companion-applications/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await CompanionApplication.deleteOne({ id });
  if (deleted.deletedCount === 0) {
    return res.status(404).json({ error: "application not found" });
  }
  res.json({ ok: true });
});

app.get("/api/companions", async (req, res) => {
  const approved = await CompanionApplication.find({ status: "approved" })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({
    success: true,
    data: approved.map(toPublicCompanion),
  });
});

app.get("/api/meditations", async (req, res) => {
  const meditations = await Meditation.find().sort({ createdAt: -1 }).lean();
  res.json(
    meditations.map((item) => ({
      id: item.id,
      title: item.title,
      duration: item.duration,
      level: item.level || "",
      category: item.category || "",
      description: item.description || "",
      status: item.status || "Draft",
      thumbnailUrl: item.thumbnailUrl || "",
      bannerUrl: item.bannerUrl || "",
      audioUrl: item.audioUrl || "",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  );
});

app.post("/api/meditations", async (req, res) => {
  const {
    title,
    duration,
    level,
    category,
    description,
    status,
    thumbnailUrl,
    audioUrl,
    bannerUrl,
  } = req.body || {};

  if (!title || typeof duration !== "number") {
    return res.status(400).json({ error: "title and duration are required" });
  }

  const created = await Meditation.create({
    title,
    duration,
    level: level || "",
    category: category || "",
    description: description || "",
    status: status || "Draft",
    thumbnailUrl: thumbnailUrl || "",
    audioUrl: audioUrl || "",
    bannerUrl: bannerUrl || "",
  });

  res.status(201).json({
    id: created.id,
    title: created.title,
    duration: created.duration,
    level: created.level || "",
    category: created.category || "",
    description: created.description || "",
    status: created.status || "Draft",
    thumbnailUrl: created.thumbnailUrl || "",
    bannerUrl: created.bannerUrl || "",
    audioUrl: created.audioUrl || "",
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
});

app.put("/api/meditations/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    duration,
    level,
    category,
    description,
    status,
    thumbnailUrl,
    audioUrl,
    bannerUrl,
  } = req.body || {};

  const updated = await Meditation.findOneAndUpdate(
    { id },
    {
      ...(title !== undefined ? { title } : {}),
      ...(typeof duration === "number" ? { duration } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
      ...(audioUrl !== undefined ? { audioUrl } : {}),
      ...(bannerUrl !== undefined ? { bannerUrl } : {}),
    },
    { new: true, runValidators: true, timestamps: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "meditation not found" });
  }

  res.json({
    id: updated.id,
    title: updated.title,
    duration: updated.duration,
    level: updated.level || "",
    category: updated.category || "",
    description: updated.description || "",
    status: updated.status || "Draft",
    thumbnailUrl: updated.thumbnailUrl || "",
    bannerUrl: updated.bannerUrl || "",
    audioUrl: updated.audioUrl || "",
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

app.delete("/api/meditations/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Meditation.deleteOne({ id });
  if (deleted.deletedCount === 0) {
    return res.status(404).json({ error: "meditation not found" });
  }
  res.json({ ok: true });
});

app.get("/api/sounds", async (req, res) => {
  const sounds = await Sound.find().sort({ createdAt: -1 }).lean();
  res.json(
    sounds.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist || "",
      frequency: item.frequency || "",
      duration: item.duration,
      category: item.category || "",
      description: item.description || "",
      status: item.status || "Draft",
      thumbnailUrl: item.thumbnailUrl || "",
      bannerUrl: item.bannerUrl || "",
      audioUrl: item.audioUrl || "",
      mood: Array.isArray(item.mood) ? item.mood : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  );
});

app.post("/api/sounds", async (req, res) => {
  const {
    title,
    artist,
    frequency,
    duration,
    category,
    description,
    status,
    thumbnailUrl,
    audioUrl,
    bannerUrl,
    mood,
  } = req.body || {};

  if (!title || typeof duration !== "number") {
    return res.status(400).json({ error: "title and duration are required" });
  }

  const created = await Sound.create({
    title,
    artist: artist || "",
    frequency: frequency || "",
    duration,
    category: category || "",
    description: description || "",
    status: status || "Draft",
    thumbnailUrl: thumbnailUrl || "",
    audioUrl: audioUrl || "",
    bannerUrl: bannerUrl || "",
    mood: Array.isArray(mood) ? mood : [],
  });

  res.status(201).json({
    id: created.id,
    title: created.title,
    artist: created.artist || "",
    frequency: created.frequency || "",
    duration: created.duration,
    category: created.category || "",
    description: created.description || "",
    status: created.status || "Draft",
    thumbnailUrl: created.thumbnailUrl || "",
    bannerUrl: created.bannerUrl || "",
    audioUrl: created.audioUrl || "",
    mood: Array.isArray(created.mood) ? created.mood : [],
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  });
});

app.put("/api/sounds/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    artist,
    frequency,
    duration,
    category,
    description,
    status,
    thumbnailUrl,
    audioUrl,
    bannerUrl,
    mood,
  } = req.body || {};

  const updated = await Sound.findOneAndUpdate(
    { id },
    {
      ...(title !== undefined ? { title } : {}),
      ...(artist !== undefined ? { artist } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(typeof duration === "number" ? { duration } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
      ...(audioUrl !== undefined ? { audioUrl } : {}),
      ...(bannerUrl !== undefined ? { bannerUrl } : {}),
      ...(mood !== undefined ? { mood: Array.isArray(mood) ? mood : [] } : {}),
    },
    { new: true, runValidators: true, timestamps: true },
  );

  if (!updated) {
    return res.status(404).json({ error: "sound not found" });
  }

  res.json({
    id: updated.id,
    title: updated.title,
    artist: updated.artist || "",
    frequency: updated.frequency || "",
    duration: updated.duration,
    category: updated.category || "",
    description: updated.description || "",
    status: updated.status || "Draft",
    thumbnailUrl: updated.thumbnailUrl || "",
    bannerUrl: updated.bannerUrl || "",
    audioUrl: updated.audioUrl || "",
    mood: Array.isArray(updated.mood) ? updated.mood : [],
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  });
});

app.delete("/api/sounds/:id", async (req, res) => {
  const { id } = req.params;
  const deleted = await Sound.deleteOne({ id });
  if (deleted.deletedCount === 0) {
    return res.status(404).json({ error: "sound not found" });
  }
  res.json({ ok: true });
});

async function startServer() {
  await connectMongo();
  await seedMongo();

  app.listen(PORT, () => {
    console.log(`Nirvaha backend running on port ${PORT}`);
  });
}

startServer();
