// Get nearby places using Google Places Nearby Search API
export async function getNearbyPlaces({ lat, lng, type = '', radius = 1500, opennow = false }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY in .env");
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}`;
  if (type) url += `&type=${type}`;
  if (opennow) url += `&opennow=true`;
  url += `&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch from Google Places API");
  const data = await res.json();
  if (data.status !== "OK") throw new Error(data.error_message || "Google Places API error");
  return data.results;
}
import fetch from "node-fetch";

export async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY in .env");
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,opening_hours,formatted_phone_number,website,review&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch from Google Places API");
  const data = await res.json();
  if (data.status !== "OK") throw new Error(data.error_message || "Google Places API error");
  return data.result;
}
