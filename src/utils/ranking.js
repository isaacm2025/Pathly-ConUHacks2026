// Ranking and scoring utilities for Pathly

// Crowd level weights (lower = better)
const CROWD_WEIGHTS = {
  not_busy: 1.0,
  moderate: 0.6,
  busy: 0.2,
};

// Status score (higher = better for recommending)
const STATUS_SCORES = {
  not_busy: 100,
  moderate: 60,
  busy: 30,
};

/**
 * Score a place based on multiple factors
 * Returns a score from 0-100 (higher is better)
 */
export function scorePlaceForRecommendation(place, userPreferences = {}) {
  const {
    speedVsSafety = 0.5,
    preferBusyStreets = false,
  } = userPreferences;

  let score = 50; // Base score

  // ETA score (inversely related - shorter is better)
  // Assume max reasonable ETA is 30 minutes
  const etaScore = Math.max(0, 100 - (place.eta_minutes || 15) * 3);

  // Crowd score - depends on user preference
  const crowdLevel = place.status || "moderate";
  let crowdScore;
  if (preferBusyStreets) {
    // If user prefers busy areas (feeling safer with more people)
    crowdScore = crowdLevel === "busy" ? 80 : crowdLevel === "moderate" ? 60 : 40;
  } else {
    // Default: prefer less crowded places
    crowdScore = STATUS_SCORES[crowdLevel] || 50;
  }

  // Open status score
  const openScore = place.open !== false ? 100 : 0;

  // Rating score (if available from Google)
  const ratingScore = place.rating ? (place.rating / 5) * 100 : 50;

  // Weighted combination based on user's speed preference
  // More speed-focused = ETA matters more
  // More safety/comfort focused = crowd & rating matter more
  const etaWeight = 0.2 + (speedVsSafety * 0.3); // 0.2 to 0.5
  const crowdWeight = 0.3 - (speedVsSafety * 0.15); // 0.15 to 0.3
  const openWeight = 0.3;
  const ratingWeight = 0.2 - (speedVsSafety * 0.1); // 0.1 to 0.2

  score = (
    etaScore * etaWeight +
    crowdScore * crowdWeight +
    openScore * openWeight +
    ratingScore * ratingWeight
  );

  return Math.round(score);
}

/**
 * Rank places by recommendation score
 */
export function rankPlaces(places, userPreferences = {}, filters = []) {
  let filtered = [...places];

  // Apply filters
  if (filters.includes("open")) {
    filtered = filtered.filter(p => p.open !== false);
  }
  if (filters.includes("distance")) {
    filtered = filtered.filter(p => (p.eta_minutes || 15) <= 10);
  }
  if (filters.includes("low_crowd")) {
    filtered = filtered.filter(p => p.status === "not_busy" || p.status === "moderate");
  }
  if (filters.includes("cafe")) {
    filtered = filtered.filter(p => p.type === "cafe" || (p.types && p.types.includes("cafe")));
  }
  if (filters.includes("gym")) {
    filtered = filtered.filter(p => p.type === "gym" || (p.types && p.types.includes("gym")));
  }
  if (filters.includes("library")) {
    filtered = filtered.filter(p => p.type === "library" || (p.types && p.types.includes("library")));
  }

  // Score and sort
  const scored = filtered.map(place => ({
    ...place,
    score: scorePlaceForRecommendation(place, userPreferences),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Score a route segment based on activity signals
 */
export function scoreRouteSegment(segment, userPreferences = {}) {
  const {
    preferWellLit = true,
    preferBusyStreets = true,
    avoidIsolated = true,
    speedVsSafety = 0.5,
  } = userPreferences;

  // Base score from segment data
  let score = 50;

  // Lighting score (0-100)
  const lightingScore = segment.lighting || 50;

  // Activity score based on POI density and transit access
  const activityScore = segment.activity || 50;

  // Road type score (main roads are generally safer at night)
  const roadTypeScores = {
    primary: 90,
    secondary: 80,
    tertiary: 70,
    residential: 50,
    service: 30,
    footway: 40,
  };
  const roadScore = roadTypeScores[segment.roadType] || 50;

  // Calculate weighted score
  const safetyWeight = 1 - speedVsSafety;

  if (preferWellLit) {
    score += lightingScore * 0.3 * safetyWeight;
  }
  if (preferBusyStreets) {
    score += activityScore * 0.3 * safetyWeight;
  }
  if (avoidIsolated) {
    // Penalize low-activity segments
    if (activityScore < 30) {
      score -= 20 * safetyWeight;
    }
  }

  score += roadScore * 0.2;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculate overall route safety score
 */
export function calculateRouteSafetyScore(route, streetActivity = [], userPreferences = {}) {
  if (!route.path || route.path.length < 2) {
    return route.safetyScore || 70;
  }

  // Calculate segment scores and average
  const segmentScores = [];

  for (let i = 0; i < route.path.length - 1; i++) {
    const segmentStart = route.path[i];
    const segmentEnd = route.path[i + 1];

    // Find nearby street activity
    const nearbyActivity = findNearbyStreetActivity(segmentStart, segmentEnd, streetActivity);

    const segment = {
      lighting: estimateLighting(segmentStart, segmentEnd, nearbyActivity),
      activity: estimateActivity(nearbyActivity),
      roadType: nearbyActivity[0]?.highway || "residential",
    };

    segmentScores.push(scoreRouteSegment(segment, userPreferences));
  }

  if (segmentScores.length === 0) return route.safetyScore || 70;

  // Weight by segment length (simple average for now)
  const avgScore = segmentScores.reduce((a, b) => a + b, 0) / segmentScores.length;

  return Math.round(avgScore);
}

/**
 * Find street activity data near a route segment
 */
function findNearbyStreetActivity(start, end, streetActivity) {
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;

  return streetActivity.filter(street => {
    const streetMid = street.path[Math.floor(street.path.length / 2)];
    const distance = Math.hypot(streetMid[0] - midLat, streetMid[1] - midLng);
    return distance < 0.005; // ~500m radius
  });
}

/**
 * Estimate lighting level based on road type and nearby activity
 */
function estimateLighting(start, end, nearbyActivity) {
  // Main roads typically have better lighting
  const roadType = nearbyActivity[0]?.highway || "residential";
  const baseLighting = {
    motorway: 90,
    trunk: 85,
    primary: 80,
    secondary: 70,
    tertiary: 60,
    residential: 50,
    service: 40,
    footway: 35,
    path: 20,
  };

  let lighting = baseLighting[roadType] || 50;

  // Boost if there are nearby open businesses
  if (nearbyActivity.length > 2) {
    lighting += 15;
  }

  return Math.min(100, lighting);
}

/**
 * Estimate activity level from nearby street data
 */
function estimateActivity(nearbyActivity) {
  if (nearbyActivity.length === 0) return 30;

  const avgPeople = nearbyActivity.reduce((sum, s) => sum + (s.people || 0), 0) / nearbyActivity.length;

  // Normalize to 0-100 (assuming max ~100 people)
  return Math.min(100, Math.round(avgPeople));
}

/**
 * Get segment colors for route visualization
 * Green = high safety, Yellow = moderate, Red = low
 */
export function getSegmentColors(route, streetActivity = [], userPreferences = {}) {
  if (!route.path || route.path.length < 2) {
    return ["#10B981"]; // Default green
  }

  const colors = [];

  for (let i = 0; i < route.path.length - 1; i++) {
    const segmentStart = route.path[i];
    const segmentEnd = route.path[i + 1];

    const nearbyActivity = findNearbyStreetActivity(segmentStart, segmentEnd, streetActivity);

    const segment = {
      lighting: estimateLighting(segmentStart, segmentEnd, nearbyActivity),
      activity: estimateActivity(nearbyActivity),
      roadType: nearbyActivity[0]?.highway || "residential",
    };

    const score = scoreRouteSegment(segment, userPreferences);

    // Map score to color
    if (score >= 70) {
      colors.push("#10B981"); // Green
    } else if (score >= 45) {
      colors.push("#F59E0B"); // Yellow/Amber
    } else {
      colors.push("#EF4444"); // Red
    }
  }

  return colors;
}

/**
 * Generate route description based on characteristics
 */
export function generateRouteDescription(route, streetActivity = [], userPreferences = {}) {
  const safetyScore = calculateRouteSafetyScore(route, streetActivity, userPreferences);

  const descriptions = {
    high: [
      "More lighting and active streets",
      "Well-lit route with nearby transit",
      "Passes through busy areas",
      "Good visibility throughout",
    ],
    medium: [
      "Good balance of speed and safety",
      "Mix of active and quiet streets",
      "Some well-lit sections",
      "Moderate pedestrian activity",
    ],
    low: [
      "Shortest path, some quieter areas",
      "Faster route with less activity",
      "Some isolated sections",
      "Quick but less populated",
    ],
  };

  const level = safetyScore >= 80 ? "high" : safetyScore >= 60 ? "medium" : "low";
  const options = descriptions[level];

  return options[Math.floor(Math.random() * options.length)];
}

export default {
  scorePlaceForRecommendation,
  rankPlaces,
  scoreRouteSegment,
  calculateRouteSafetyScore,
  getSegmentColors,
  generateRouteDescription,
};
