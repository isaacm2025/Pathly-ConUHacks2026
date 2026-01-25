// Unified API utility for Pathly
// Fetches real data from Google Places API with fallback to mock data

// Mock data for fallback
const mockPlaces = [
  { id: "1", place_id: "mock-1", name: "Blue Bottle Coffee", type: "cafe", types: ["cafe"], status: "not_busy", eta_minutes: 7, latitude: 45.5022, longitude: -73.5560, rating: 4.5, open: true, vicinity: "1 Place Ville Marie" },
  { id: "2", place_id: "mock-2", name: "Nautilus Plus", type: "gym", types: ["gym"], status: "moderate", eta_minutes: 12, latitude: 45.5012, longitude: -73.5755, rating: 4.2, open: true, vicinity: "500 Sherbrooke St W" },
  { id: "3", place_id: "mock-3", name: "Grande Bibliotheque", type: "library", types: ["library"], status: "not_busy", eta_minutes: 9, latitude: 45.5165, longitude: -73.5619, rating: 4.6, open: true, vicinity: "475 De Maisonneuve Blvd E" },
  { id: "4", place_id: "mock-4", name: "WeWork Fulton", type: "cowork", types: ["coworking_space"], status: "busy", eta_minutes: 15, latitude: 45.5007, longitude: -73.5702, rating: 4.0, open: true, vicinity: "3 Place Ville Marie" },
  { id: "5", place_id: "mock-5", name: "Cafe Olimpico", type: "cafe", types: ["cafe"], status: "moderate", eta_minutes: 6, latitude: 45.5233, longitude: -73.6007, rating: 4.4, open: true, vicinity: "124 Rue Saint-Viateur O" },
];

const mockRoutes = [
  {
    id: "1",
    type: "safest",
    eta: 14,
    safetyScore: 94,
    description: "More lighting and active streets",
    path: [[45.5019, -73.5674], [45.5045, -73.5738], [45.5070, -73.5710], [45.5095, -73.5670]]
  },
  {
    id: "2",
    type: "balanced",
    eta: 11,
    safetyScore: 82,
    description: "Good balance of speed and safety",
    path: [[45.5019, -73.5674], [45.5035, -73.5630], [45.5065, -73.5640], [45.5095, -73.5670]]
  },
  {
    id: "3",
    type: "fastest",
    eta: 8,
    safetyScore: 68,
    description: "Shortest path, some quieter areas",
    path: [[45.5019, -73.5674], [45.5055, -73.5660], [45.5095, -73.5670]]
  },
];

// Fetch nearby places using Google Places API directly (client-side)
export async function fetchNearbyPlacesFromGoogle(map, lat, lng, type = '', radius = 1500) {
  return new Promise((resolve) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn("Google Places API not loaded, using mock data");
      resolve(mockPlaces);
      return;
    }

    const service = new window.google.maps.places.PlacesService(map);
    const location = new window.google.maps.LatLng(lat, lng);

    const request = {
      location,
      radius,
      type: type || undefined,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else {
        resolve(mockPlaces);
      }
    });
  });
}

// Legacy function for backward compatibility - returns mock data
export async function fetchNearbyPlaces(lat, lng, type = '', radius = 1500, opennow = false) {
  return mockPlaces;
}

// Fetch Google Place Details using Places Service
export async function fetchPlaceDetailsFromGoogle(map, placeId) {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      reject(new Error("Google Places API not loaded"));
      return;
    }

    const service = new window.google.maps.places.PlacesService(map);

    service.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'rating', 'website', 'geometry'],
      },
      (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Place details error: ${status}`));
        }
      }
    );
  });
}

// Legacy function
export async function fetchPlaceDetails(placeId) {
  console.warn("fetchPlaceDetails without map reference - returning empty");
  return {};
}

export async function fetchPlaces(lat, lng, preferences) {
  return mockPlaces;
}

export async function fetchRoutes(from, to, preferences) {
  return mockRoutes;
}

// ==================== MONGODB ATLAS API ====================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Get auth token from localStorage
const getToken = () => localStorage.getItem("pathly_token");

// Authenticated fetch helper
const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
};

// ==================== AUTH ====================

export const auth = {
  async register(email, username, password, priority = "safety") {
    const data = await authFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password, priority }),
    });
    if (data.token) {
      localStorage.setItem("pathly_token", data.token);
      localStorage.setItem("pathly_user", JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password) {
    const data = await authFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem("pathly_token", data.token);
      localStorage.setItem("pathly_user", JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem("pathly_token");
    localStorage.removeItem("pathly_user");
  },

  isLoggedIn() {
    return !!getToken();
  },

  getUser() {
    const user = localStorage.getItem("pathly_user");
    return user ? JSON.parse(user) : null;
  },
};

// ==================== SAFETY REPORTS (MongoDB Atlas) ====================

export const safetyReportsApi = {
  async submit(report) {
    // report: { type, description, latitude, longitude, severity }
    return authFetch("/api/safety-reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
  },

  async getNearby(lat, lng, radius = 1000) {
    return authFetch(`/api/safety-reports?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  async upvote(reportId) {
    return authFetch(`/api/safety-reports/${reportId}/upvote`, {
      method: "POST",
    });
  },
};

// ==================== ROUTE HISTORY (MongoDB Atlas) ====================

export const routesApi = {
  async save(route) {
    // route: { origin, destination, waypoints, distance, duration, safetyScore }
    return authFetch("/api/routes", {
      method: "POST",
      body: JSON.stringify(route),
    });
  },

  async getHistory() {
    return authFetch("/api/routes");
  },
};

// ==================== FAVORITE PLACES (MongoDB Atlas) ====================

export const favoritesApi = {
  async add(place) {
    // place: { placeId, name, address, latitude, longitude, category }
    return authFetch("/api/favorites", {
      method: "POST",
      body: JSON.stringify(place),
    });
  },

  async getAll() {
    return authFetch("/api/favorites");
  },

  async remove(favoriteId) {
    return authFetch(`/api/favorites/${favoriteId}`, {
      method: "DELETE",
    });
  },
};

// ==================== USER PROFILE (MongoDB Atlas) ====================

export const profileApi = {
  async get() {
    return authFetch("/api/profile");
  },

  async update(updates) {
    // updates: { priority, username }
    return authFetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
};
