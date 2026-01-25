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

// ==================== LIVE DATA APIs ====================

// Fetch Montreal crime/incident data from Open Data Portal (LAST 7 DAYS by default)
// Serve cached incidents from MongoDB (last 24h)
app.get("/api/live/incidents", async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    const db = await connectDB();
    const col = db.collection("liveIncidents");
    // Only incidents from last 24h
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const query = { date: { $gte: cutoffDate.toISOString().split('T')[0] } };
    let incidents = await col.find(query).toArray();
    // Filter by proximity
    if (lat && lng) {
      incidents = incidents.filter(record => {
        if (!record.latitude || !record.longitude) return false;
        const distance = getDistanceKm(
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(record.latitude),
          parseFloat(record.longitude)
        );
        return distance <= (radius / 1000);
      });
    }
    incidents = incidents.slice(0, 50);
    res.json({
      incidents,
      source: "MongoDB Atlas (cached)",
      count: incidents.length,
      timeWindow: "Last 24 hours",
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Live incidents error:", error);
    res.json({ incidents: [], source: "error", error: error.message });
  }
});

// Fetch weather data affecting walking safety
// Serve cached weather from MongoDB
app.get("/api/live/weather", async (req, res) => {
  try {
    const db = await connectDB();
    const col = db.collection("liveWeather");
    const weather = await col.findOne({}, { sort: { fetchedAt: -1 } });
    if (!weather) return res.json({ temperature: null, conditions: "unknown", walkingSafety: "unknown", source: "cache-miss" });
    res.json(weather);
  } catch (error) {
    console.error("Weather error:", error);
    res.json({ temperature: null, conditions: "unknown", walkingSafety: "unknown", source: "error" });
  }
});

// Fetch construction/road closures from Montreal Open Data
// Serve cached construction data from MongoDB
app.get("/api/live/construction", async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    const db = await connectDB();
    const col = db.collection("liveConstructions");
    let constructions = await col.find({}).toArray();
    // Filter by proximity
    if (lat && lng) {
      constructions = constructions.filter(record => {
        if (!record.latitude || !record.longitude) return false;
        const distance = getDistanceKm(
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(record.latitude),
          parseFloat(record.longitude)
        );
        return distance <= (radius / 1000);
      });
    }
    constructions = constructions.slice(0, 30);
    res.json({ constructions, source: "MongoDB Atlas (cached)", count: constructions.length });
  } catch (error) {
    console.error("Construction error:", error);
    res.json({ constructions: [], source: "error" });
  }
});

// Fetch street lighting data from OpenStreetMap via Overpass API
// Serve cached lighting data from MongoDB
app.get("/api/live/lighting", async (req, res) => {
  try {
    const db = await connectDB();
    const col = db.collection("liveLighting");
    const lights = await col.find({}).toArray();
    // Calculate lighting coverage score
    const coverageScore = Math.min(100, lights.length * 5);
    res.json({
      lights,
      count: lights.length,
      coverageScore,
      assessment: coverageScore > 70 ? "well_lit" : coverageScore > 40 ? "moderate" : "poorly_lit",
      source: "MongoDB Atlas (cached)"
    });
  } catch (error) {
    console.error("Lighting error:", error);
    res.json({ lights: [], coverageScore: 50, assessment: "unknown", source: "error" });
  }
});

// Aggregate all live safety data
app.get("/api/live/safety-summary", async (req, res) => {
  try {
    const { lat = 45.5019, lng = -73.5674, radius = 1000 } = req.query;
    
    // Fetch all data in parallel
    const [incidentsRes, weatherRes, constructionRes, lightingRes] = await Promise.allSettled([
      fetch(`http://localhost:${process.env.PORT || 3000}/api/live/incidents?lat=${lat}&lng=${lng}&radius=${radius}`).then(r => r.json()),
      fetch(`http://localhost:${process.env.PORT || 3000}/api/live/weather?lat=${lat}&lng=${lng}`).then(r => r.json()),
      fetch(`http://localhost:${process.env.PORT || 3000}/api/live/construction?lat=${lat}&lng=${lng}&radius=${radius}`).then(r => r.json()),
      fetch(`http://localhost:${process.env.PORT || 3000}/api/live/lighting?lat=${lat}&lng=${lng}&radius=${Math.min(radius, 500)}`).then(r => r.json())
    ]);

    const incidents = incidentsRes.status === 'fulfilled' ? incidentsRes.value : { incidents: [] };
    const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : { walkingSafety: 'unknown' };
    const construction = constructionRes.status === 'fulfilled' ? constructionRes.value : { constructions: [] };
    const lighting = lightingRes.status === 'fulfilled' ? lightingRes.value : { assessment: 'unknown' };

    // Calculate overall safety score
    let safetyScore = 85; // Base score
    safetyScore -= incidents.incidents?.length * 2 || 0;
    safetyScore -= construction.constructions?.length * 1 || 0;
    if (weather.walkingSafety === 'poor') safetyScore -= 15;
    if (weather.walkingSafety === 'moderate') safetyScore -= 5;
    if (lighting.assessment === 'poorly_lit') safetyScore -= 10;
    safetyScore = Math.max(0, Math.min(100, safetyScore));

    res.json({
      safetyScore,
      incidents: incidents.incidents?.slice(0, 10) || [],
      weather,
      constructions: construction.constructions?.slice(0, 10) || [],
      lighting,
      timestamp: new Date().toISOString(),
      sources: ["Montreal Open Data", "OpenStreetMap", "OpenWeatherMap"]
    });
  } catch (error) {
    console.error("Safety summary error:", error);
    res.json({ safetyScore: 75, error: error.message });
  }
});

// Helper functions for live data
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getSeverityFromCategory(category) {
  const highSeverity = ['vol qualifié', 'agression', 'voies de fait', 'méfait'];
  const mediumSeverity = ['vol de véhicule', 'vol dans véhicule', 'introduction'];
  const cat = (category || '').toLowerCase();
  if (highSeverity.some(s => cat.includes(s))) return 'high';
  if (mediumSeverity.some(s => cat.includes(s))) return 'medium';
  return 'low';
}

// Convert date to "X hours ago" or "X minutes ago" format
function getTimeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function calculateWeatherSafety(data) {
  if (!data.weather) return 'unknown';
  const conditions = data.weather[0]?.main?.toLowerCase();
  const visibility = data.visibility || 10000;
  const temp = data.main?.temp || 10;
  
  if (visibility < 1000 || conditions?.includes('storm') || conditions?.includes('snow')) return 'poor';
  if (visibility < 5000 || temp < -10 || temp > 35 || conditions?.includes('rain')) return 'moderate';
  return 'good';
}

function getWeatherAlerts(data) {
  const alerts = [];
  if (!data.weather) return alerts;
  
  const conditions = data.weather[0]?.main?.toLowerCase();
  const visibility = data.visibility || 10000;
  const temp = data.main?.temp || 10;
  
  if (visibility < 2000) alerts.push({ type: 'visibility', message: 'Low visibility - be careful' });
  if (temp < -15) alerts.push({ type: 'cold', message: 'Extreme cold - limit outdoor time' });
  if (temp > 32) alerts.push({ type: 'heat', message: 'High heat - stay hydrated' });
  if (conditions?.includes('snow')) alerts.push({ type: 'snow', message: 'Snowy conditions - watch for ice' });
  if (conditions?.includes('rain')) alerts.push({ type: 'rain', message: 'Rainy - slippery surfaces' });
  
  return alerts;
}


app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
