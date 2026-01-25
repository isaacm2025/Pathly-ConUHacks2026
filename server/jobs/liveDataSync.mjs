// server/jobs/liveDataSync.mjs
// Periodically fetches live data from external APIs and stores in MongoDB

import { connectDB } from "../db.mjs";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const dbName = process.env.MONGO_DB_NAME || "pathly";
const dbCollections = {
  incidents: "liveIncidents",
  weather: "liveWeather",
  constructions: "liveConstructions",
  lighting: "liveLighting"
};

async function fetchAndStoreIncidents(hours = 24) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
  const crimeUrl = `https://donnees.montreal.ca/api/3/action/datastore_search_sql?sql=SELECT * FROM "c6f482bf-bf0f-4960-8b2f-9982c211addd" WHERE "DATE" >= '${cutoffDateStr}' ORDER BY "DATE" DESC LIMIT 200`;
  const response = await fetch(crimeUrl);
  const data = await response.json();
  const incidents = (data.result?.records || []).map(record => ({
    id: record._id,
    type: record.CATEGORIE || "incident",
    description: record.CATEGORIE,
    latitude: parseFloat(record.LATITUDE),
    longitude: parseFloat(record.LONGITUDE),
    date: record.DATE,
    severity: record.CATEGORIE,
    source: "montreal_open_data"
  }));
  const db = await connectDB();
  const col = db.collection(dbCollections.incidents);
  await col.deleteMany({});
  if (incidents.length) await col.insertMany(incidents);
  return incidents.length;
}

async function fetchAndStoreWeather(lat = 45.5019, lng = -73.5674) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  const data = await response.json();
  const db = await connectDB();
  const col = db.collection(dbCollections.weather);
  await col.deleteMany({});
  await col.insertOne({ ...data, fetchedAt: new Date() });
}

async function fetchAndStoreConstructions() {
  const resourceId = 'a305b9e9-94b5-4fa4-9d65-d5b0def5e8e7';
  const url = `https://donnees.montreal.ca/api/3/action/datastore_search?resource_id=${resourceId}&limit=100`;
  const response = await fetch(url);
  const data = await response.json();
  const constructions = (data.result?.records || []).map(record => ({
    id: record._id,
    type: "construction",
    description: record.NOM_PROJET || record.DESCRIPTION || "Road work",
    street: record.RUE || "Unknown street",
    latitude: parseFloat(record.LATITUDE),
    longitude: parseFloat(record.LONGITUDE),
    startDate: record.DATE_DEBUT,
    endDate: record.DATE_FIN,
    severity: "medium",
    source: "montreal_open_data"
  }));
  const db = await connectDB();
  const col = db.collection(dbCollections.constructions);
  await col.deleteMany({});
  if (constructions.length) await col.insertMany(constructions);
}

async function fetchAndStoreLighting(lat = 45.5019, lng = -73.5674, radius = 500) {
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["highway"="street_lamp"](around:${radius},${lat},${lng});
      node["lit"="yes"](around:${radius},${lat},${lng});
    );
    out body;
  `;
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
  const response = await fetch(overpassUrl);
  const data = await response.json();
  const lights = data.elements?.map(el => ({
    id: el.id,
    latitude: el.lat,
    longitude: el.lon,
    type: el.tags?.["lamp_type"] || "standard",
    source: "openstreetmap"
  })) || [];
  const db = await connectDB();
  const col = db.collection(dbCollections.lighting);
  await col.deleteMany({});
  if (lights.length) await col.insertMany(lights);
}

export async function syncAllLiveData() {
  await fetchAndStoreIncidents(24);
  await fetchAndStoreWeather();
  await fetchAndStoreConstructions();
  await fetchAndStoreLighting();
  console.log("[LiveDataSync] All live data updated in MongoDB.");
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  syncAllLiveData().then(() => process.exit(0));
}
