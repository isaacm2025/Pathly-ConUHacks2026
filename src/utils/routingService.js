// Routing service using Google Directions API for real walking routes

/**
 * Decode Google's encoded polyline format to array of coordinates
 * @param {string} encoded - Encoded polyline string
 * @returns {Array<[number, number]>} Array of [lat, lng] coordinates
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Simplify path by reducing number of points while preserving shape
 * Uses Douglas-Peucker algorithm simplified
 */
function simplifyPath(points, tolerance = 0.0001) {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from the line between first and last
  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return Math.hypot(x - xx, y - yy);
}

/**
 * Fetch walking routes from Google Directions API
 * Returns multiple alternative routes when available
 */
export async function fetchWalkingRoutes(origin, destination) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps?.DirectionsService) {
      reject(new Error("Google Maps not loaded"));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: origin[0], lng: origin[1] },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: window.google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true, // Request alternative routes
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const routes = result.routes.map((route, index) => {
            // Extract the full path from the route
            const path = [];
            route.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                // Decode the polyline for this step
                const stepPoints = decodePolyline(step.polyline.points);
                path.push(...stepPoints);
              });
            });

            // Simplify path for performance (keep enough detail for accuracy)
            const simplifiedPath = simplifyPath(path, 0.00005);

            // Get route details
            const leg = route.legs[0];
            const durationMinutes = Math.round(leg.duration.value / 60);
            const distanceMeters = leg.distance.value;

            return {
              id: String(index + 1),
              path: simplifiedPath,
              eta: durationMinutes,
              distance: distanceMeters,
              distanceText: leg.distance.text,
              durationText: leg.duration.text,
              summary: route.summary || `Route ${index + 1}`,
              warnings: route.warnings || [],
              // Store step-by-step directions for turn-by-turn
              steps: leg.steps.map((step) => ({
                instruction: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text,
                maneuver: step.maneuver,
                path: decodePolyline(step.polyline.points),
              })),
            };
          });

          resolve(routes);
        } else {
          console.error("Directions request failed:", status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
}

/**
 * Analyze route path for safety factors
 * This estimates safety based on route characteristics
 */
export function analyzeRouteSafety(route, streetActivity = []) {
  const path = route.path;
  if (!path || path.length < 2) {
    return { lighting: 50, activity: 50, roadQuality: 50 };
  }

  // Find nearby street activity for each segment
  let totalLighting = 0;
  let totalActivity = 0;
  let segmentCount = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const segmentStart = path[i];
    const segmentEnd = path[i + 1];
    const midLat = (segmentStart[0] + segmentEnd[0]) / 2;
    const midLng = (segmentStart[1] + segmentEnd[1]) / 2;

    // Find nearby street activity
    const nearbyStreets = streetActivity.filter((street) => {
      if (!street.path || street.path.length === 0) return false;
      const streetMid = street.path[Math.floor(street.path.length / 2)];
      const distance = Math.hypot(streetMid[0] - midLat, streetMid[1] - midLng);
      return distance < 0.003; // ~300m radius
    });

    // Estimate lighting based on nearby activity
    let segmentLighting = 50;
    let segmentActivity = 30;

    if (nearbyStreets.length > 0) {
      // More streets nearby = better lighting typically
      segmentLighting = Math.min(90, 50 + nearbyStreets.length * 10);

      // Calculate average people in area
      const avgPeople =
        nearbyStreets.reduce((sum, s) => sum + (s.people || 0), 0) /
        nearbyStreets.length;
      segmentActivity = Math.min(100, avgPeople);

      // Boost lighting if there's activity (businesses open, etc.)
      if (avgPeople > 20) {
        segmentLighting = Math.min(95, segmentLighting + 15);
      }
    }

    totalLighting += segmentLighting;
    totalActivity += segmentActivity;
    segmentCount++;
  }

  const avgLighting = segmentCount > 0 ? totalLighting / segmentCount : 50;
  const avgActivity = segmentCount > 0 ? totalActivity / segmentCount : 30;

  return {
    lighting: Math.round(avgLighting),
    activity: Math.round(avgActivity),
    // Longer routes through more streets tend to be on main roads
    roadQuality: Math.min(90, 50 + (path.length > 20 ? 20 : path.length)),
  };
}

/**
 * Calculate overall safety score for a route
 */
export function calculateSafetyScore(route, streetActivity = [], userPreferences = {}) {
  const analysis = analyzeRouteSafety(route, streetActivity);

  const {
    preferWellLit = true,
    preferBusyStreets = true,
    speedVsSafety = 0.5,
  } = userPreferences;

  let score = 50;
  const safetyWeight = 1 - speedVsSafety;

  // Lighting contribution (0-30 points)
  if (preferWellLit) {
    score += (analysis.lighting / 100) * 30 * safetyWeight;
  } else {
    score += (analysis.lighting / 100) * 15;
  }

  // Activity contribution (0-30 points)
  if (preferBusyStreets) {
    score += (analysis.activity / 100) * 30 * safetyWeight;
  } else {
    score += (analysis.activity / 100) * 15;
  }

  // Road quality contribution (0-20 points)
  score += (analysis.roadQuality / 100) * 20;

  // Time penalty - very long routes through quiet areas are less safe
  // But short routes through isolated areas are also concerning
  const optimalEta = 10; // 10 minutes is considered optimal
  const etaDiff = Math.abs(route.eta - optimalEta);
  const etaPenalty = Math.min(10, etaDiff * 0.5);
  score -= etaPenalty * safetyWeight;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Classify routes as safest, balanced, or fastest
 */
export function classifyRoutes(routes, streetActivity = [], userPreferences = {}) {
  if (routes.length === 0) return [];

  // Score all routes
  const scoredRoutes = routes.map((route) => ({
    ...route,
    safetyScore: calculateSafetyScore(route, streetActivity, userPreferences),
  }));

  // Sort by safety score (descending)
  scoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

  // Also sort by ETA to identify fastest
  const byEta = [...scoredRoutes].sort((a, b) => a.eta - b.eta);
  const fastestId = byEta[0]?.id;

  // Classify routes
  return scoredRoutes.map((route, index) => {
    let type;
    if (index === 0) {
      type = "safest";
    } else if (route.id === fastestId && index !== 0) {
      type = "fastest";
    } else {
      type = "balanced";
    }

    return {
      ...route,
      type,
      baseSafetyScore: route.safetyScore,
    };
  });
}

/**
 * Get segment colors for route visualization
 */
export function getRouteSegmentColors(route, streetActivity = [], userPreferences = {}) {
  const path = route.path;
  if (!path || path.length < 2) {
    return ["#10B981"]; // Default green
  }

  const colors = [];

  // Sample every few points for performance
  const sampleRate = Math.max(1, Math.floor(path.length / 20));

  for (let i = 0; i < path.length - 1; i += sampleRate) {
    const segmentStart = path[i];
    const segmentEnd = path[Math.min(i + sampleRate, path.length - 1)];
    const midLat = (segmentStart[0] + segmentEnd[0]) / 2;
    const midLng = (segmentStart[1] + segmentEnd[1]) / 2;

    // Find nearby activity
    const nearbyStreets = streetActivity.filter((street) => {
      if (!street.path || street.path.length === 0) return false;
      const streetMid = street.path[Math.floor(street.path.length / 2)];
      const distance = Math.hypot(streetMid[0] - midLat, streetMid[1] - midLng);
      return distance < 0.003;
    });

    // Calculate segment score
    let segmentScore = 50;
    if (nearbyStreets.length > 0) {
      const avgPeople =
        nearbyStreets.reduce((sum, s) => sum + (s.people || 0), 0) /
        nearbyStreets.length;
      segmentScore = Math.min(100, 30 + nearbyStreets.length * 15 + avgPeople * 0.5);
    }

    // Map score to color
    if (segmentScore >= 70) {
      colors.push("#10B981"); // Green - safe
    } else if (segmentScore >= 45) {
      colors.push("#F59E0B"); // Amber - moderate
    } else {
      colors.push("#EF4444"); // Red - caution
    }
  }

  return colors;
}

/**
 * Generate route description based on characteristics
 */
export function generateDescription(route, streetActivity = []) {
  const analysis = analyzeRouteSafety(route, streetActivity);

  if (analysis.lighting >= 70 && analysis.activity >= 50) {
    return "More lighting and active streets";
  } else if (analysis.lighting >= 60) {
    return "Well-lit route with some quiet sections";
  } else if (analysis.activity >= 60) {
    return "Passes through busy areas";
  } else if (route.eta <= 8) {
    return "Shortest path, some quieter areas";
  } else {
    return "Mix of active and quiet streets";
  }
}

export default {
  fetchWalkingRoutes,
  analyzeRouteSafety,
  calculateSafetyScore,
  classifyRoutes,
  getRouteSegmentColors,
  generateDescription,
};
