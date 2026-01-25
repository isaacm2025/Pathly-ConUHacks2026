import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.mjs";
import ttsRouter from "./routes/tts.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("ENV CHECK:", process.env.MONGO_URL ? "LOADED" : "MISSING");
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to server/.env");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", ttsRouter);

const db = await connectDB();
const users = db.collection("users");
const safetyReports = db.collection("safetyReports");
const routeHistory = db.collection("routeHistory");
const favoritePlaces = db.collection("favoritePlaces");

await Promise.all([
  users.createIndex({ email: 1 }, { unique: true }),
  users.createIndex({ username: 1 }, { unique: true }),
  safetyReports.createIndex({ location: "2dsphere" }),
  safetyReports.createIndex({ createdAt: -1 }),
  routeHistory.createIndex({ userId: 1, createdAt: -1 }),
  favoritePlaces.createIndex({ userId: 1 })
]);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeUsername = (value) => String(value || "").trim();
const normalizePriority = (value) => (value === "speed" ? "speed" : "safety");

// JWT Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/", (req, res) => {
  res.send("Pathly backend running");
});

app.post("/auth/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const priority = normalizePriority(req.body?.priority);

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required." });
    }

    const existing = await users.findOne({
      $or: [{ email }, { username }]
    });

    if (existing) {
      return res.status(409).json({ error: "User exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      email,
      username,
      passwordHash,
      priority,
      createdAt: new Date()
    });

    const token = jwt.sign({ sub: result.insertedId.toString(), email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      success: true,
      token,
      user: { email, username, priority }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "User exists" });
    }
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || "");
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ sub: user._id.toString(), email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      token,
      user: {
        email: user.email,
        username: user.username,
        priority: user.priority || "safety"
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed." });
  }
});

// ==================== SAFETY REPORTS ====================

// Submit a safety report (public - no auth required)
app.post("/api/safety-reports", async (req, res) => {
  try {
    const { type, description, latitude, longitude, severity } = req.body;
    
    if (!type || !latitude || !longitude) {
      return res.status(400).json({ error: "Type and location are required" });
    }

    const report = {
      type, // 'hazard', 'poorly_lit', 'unsafe_area', 'construction', 'other'
      description: description || "",
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      severity: severity || "medium", // 'low', 'medium', 'high'
      verified: false,
      upvotes: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    const result = await safetyReports.insertOne(report);
    res.json({ success: true, id: result.insertedId, report });
  } catch (error) {
    console.error("Safety report failed:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// Get safety reports near a location
app.get("/api/safety-reports", async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query; // radius in meters
    
    if (!lat || !lng) {
      return res.status(400).json({ error: "Location required" });
    }

    const reports = await safetyReports.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      expiresAt: { $gt: new Date() }
    }).limit(50).toArray();

    res.json({ reports });
  } catch (error) {
    console.error("Get reports failed:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
});

// Upvote a safety report
app.post("/api/safety-reports/:id/upvote", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const result = await safetyReports.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { upvotes: 1 } }
    );
    res.json({ success: result.modifiedCount > 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to upvote" });
  }
});

// ==================== ROUTE HISTORY ====================

// Save a route (requires auth)
app.post("/api/routes", authMiddleware, async (req, res) => {
  try {
    const { origin, destination, waypoints, distance, duration, safetyScore } = req.body;
    
    const route = {
      userId: req.userId,
      origin,
      destination,
      waypoints: waypoints || [],
      distance,
      duration,
      safetyScore,
      createdAt: new Date()
    };

    const result = await routeHistory.insertOne(route);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Save route failed:", error);
    res.status(500).json({ error: "Failed to save route" });
  }
});

// Get user's route history
app.get("/api/routes", authMiddleware, async (req, res) => {
  try {
    const routes = await routeHistory
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    res.json({ routes });
  } catch (error) {
    res.status(500).json({ error: "Failed to get routes" });
  }
});

// ==================== FAVORITE PLACES ====================

// Save a favorite place
app.post("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const { placeId, name, address, latitude, longitude, category } = req.body;
    
    const place = {
      userId: req.userId,
      placeId,
      name,
      address,
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      category: category || "other",
      createdAt: new Date()
    };

    const result = await favoritePlaces.insertOne(place);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: "Failed to save favorite" });
  }
});

// Get user's favorites
app.get("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const favorites = await favoritePlaces
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ error: "Failed to get favorites" });
  }
});

// Delete a favorite
app.delete("/api/favorites/:id", authMiddleware, async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const result = await favoritePlaces.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.userId
    });
    res.json({ success: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete favorite" });
  }
});

// ==================== USER PROFILE ====================

// Get user profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const user = await users.findOne({ _id: new ObjectId(req.userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      email: user.email,
      username: user.username,
      priority: user.priority,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// Update user preferences
app.put("/api/profile", authMiddleware, async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const { priority, username } = req.body;
    const updates = {};
    if (priority) updates.priority = normalizePriority(priority);
    if (username) updates.username = normalizeUsername(username);
    
    await users.updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: updates }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
