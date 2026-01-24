// Fetch real nearby places from backend (Google Places API)
export async function fetchNearbyPlaces(lat, lng, type = '', radius = 1500, opennow = false) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), type, radius: String(radius) });
  if (opennow) params.append('opennow', 'true');
  const res = await fetch(`${API_BASE}/api/nearby-places?${params}`);
  if (!res.ok) throw new Error('Failed to fetch nearby places');
  return await res.json();
}
// Fetch Google Place Details via backend
export async function fetchPlaceDetails(placeId) {
  const res = await fetch(`${API_BASE}/api/place-details/${placeId}`);
  if (!res.ok) throw new Error('Failed to fetch place details');
  return await res.json();
}
// Unified API utility for Pathly
// Falls back to mock data if backend is unavailable

const API_BASE = import.meta.env.VITE_BASE44_APP_BASE_URL || '';

// Mock data for fallback
const mockPlaces = [
  { id: "1", name: "Blue Bottle Coffee", type: "cafe", status: "not_busy", eta_minutes: 7, latitude: 40.7145, longitude: -74.0071 },
  { id: "2", name: "Equinox Tribeca", type: "gym", status: "moderate", eta_minutes: 12, latitude: 40.7162, longitude: -74.0085 },
  { id: "3", name: "NYPL Battery Park", type: "library", status: "not_busy", eta_minutes: 9, latitude: 40.7105, longitude: -74.0155 },
  { id: "4", name: "WeWork Fulton", type: "cowork", status: "busy", eta_minutes: 15, latitude: 40.7095, longitude: -74.0070 },
  { id: "5", name: "Stumptown Coffee", type: "cafe", status: "moderate", eta_minutes: 6, latitude: 40.7185, longitude: -74.0052 },
];

const mockRoutes = [
  {
    id: "1", 
    type: "safest", 
    eta: 14, 
    safetyScore: 94,
    description: "More lighting and active streets",
    path: [[40.7128, -74.0060], [40.7140, -74.0080], [40.7160, -74.0090], [40.7180, -74.0070]]
  },
  { 
    id: "2", 
    type: "balanced", 
    eta: 11, 
    safetyScore: 82,
    description: "Good balance of speed and safety",
    path: [[40.7128, -74.0060], [40.7150, -74.0070], [40.7180, -74.0070]]
  },
  { 
    id: "3", 
    type: "fastest", 
    eta: 8, 
    safetyScore: 68,
    description: "Shortest path, some quieter areas",
    path: [[40.7128, -74.0060], [40.7155, -74.0065], [40.7180, -74.0070]]
  },
];

export async function fetchPlaces(lat, lng, preferences) {
  try {
    const params = new URLSearchParams({ lat, lng, ...preferences });
    const res = await fetch(`${API_BASE}/api/places?${params}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    return mockPlaces;
  }
}

export async function fetchRoutes(from, to, preferences) {
  try {
    const params = new URLSearchParams({ from: from.join(','), to: to.join(','), ...preferences });
    const res = await fetch(`${API_BASE}/api/routes?${params}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    return mockRoutes;
  }
}
