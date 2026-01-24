import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pathly";

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

const samplePlaces = [
  { name: "Blue Bottle Coffee", type: "cafe", status: "not_busy", eta_minutes: 7, latitude: 45.5048, longitude: -73.5772, open: true, crowd: "low", place_id: "<PLACE_ID_HERE>" },
  { name: "NYPL Battery Park", type: "library", status: "not_busy", eta_minutes: 9, latitude: 45.5088, longitude: -73.5617, open: true, crowd: "low", place_id: "<PLACE_ID_HERE>" },
  { name: "Stumptown Coffee", type: "cafe", status: "moderate", eta_minutes: 6, latitude: 45.5100, longitude: -73.5600, open: true, crowd: "moderate", place_id: "<PLACE_ID_HERE>" },
  { name: "Equinox Tribeca", type: "gym", status: "moderate", eta_minutes: 12, latitude: 45.5070, longitude: -73.5700, open: true, crowd: "moderate", place_id: "<PLACE_ID_HERE>" },
  { name: "WeWork Fulton", type: "cowork", status: "busy", eta_minutes: 15, latitude: 45.5128, longitude: -73.5550, open: true, crowd: "high", place_id: "<PLACE_ID_HERE>" },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await Place.deleteMany({});
  await Place.insertMany(samplePlaces);
  console.log("Database seeded!");
  mongoose.disconnect();
}

seed();
