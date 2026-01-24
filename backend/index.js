import { getNearbyPlaces } from "./googlePlaces.js";
// API: Get real nearby places from Google Places
app.get("/api/nearby-places", async (req, res) => {
  try {
    const { lat, lng, type, radius, opennow } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
    const results = await getNearbyPlaces({ lat, lng, type, radius, opennow: opennow === 'true' });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { getPlaceDetails } from "./googlePlaces.js";
// API: Proxy to Google Places Details
app.get("/api/place-details/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;
    const details = await getPlaceDetails(placeId);
    res.json(details);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pathly";

// MongoDB models
const placeSchema = new mongoose.Schema({
  name: String,
  type: String,
  status: String,
  eta_minutes: Number,
  latitude: Number,
  longitude: Number,
  open: Boolean,
  crowd: String,
  place_id: String, // Google Place ID
});
const Place = mongoose.model("Place", placeSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API: Get places (with optional filters)
app.get("/api/places", async (req, res) => {
  try {
    const { lat, lng, filters } = req.query;
    let query = {};
    if (filters) {
      const filterArr = filters.split(",");
      if (filterArr.includes("cafe")) query.type = "cafe";
      if (filterArr.includes("gym")) query.type = "gym";
      if (filterArr.includes("library")) query.type = "library";
      if (filterArr.includes("cowork")) query.type = "cowork";
      // Add more filters as needed
    }
    // Optionally, add geospatial filtering here
    const places = await Place.find(query).limit(20);
    res.json(places);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Add a place (for demo/testing)
app.post("/api/places", async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    res.json(place);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Get routes (mocked for now)
app.get("/api/routes", (req, res) => {
  // TODO: Integrate with Snowflake AI or real routing logic
  res.json([
    {
      id: "1",
      type: "safest",
      eta: 14,
      safetyScore: 94,
      description: "More lighting and active streets",
      path: [[45.5048, -73.5772], [45.5088, -73.5617], [45.5128, -73.5550]],
    },
    {
      id: "2",
      type: "balanced",
      eta: 11,
      safetyScore: 82,
      description: "Good balance of speed and safety",
      path: [[45.5048, -73.5772], [45.5070, -73.5700], [45.5128, -73.5550]],
    },
    {
      id: "3",
      type: "fastest",
      eta: 8,
      safetyScore: 68,
      description: "Shortest path, some quieter areas",
      path: [[45.5048, -73.5772], [45.5100, -73.5600], [45.5128, -73.5550]],
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
