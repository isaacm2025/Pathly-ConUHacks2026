// Time-aware utilities for Pathly
// Automatically determines day/night mode based on time and location

/**
 * Get approximate sunrise/sunset times for a location
 * Uses a simplified calculation - in production, you'd use a proper solar calculation
 */
export function getSunTimes(latitude, date = new Date()) {
  // Simplified calculation for demo
  // Actual implementation would use astronomical calculations
  const month = date.getMonth();
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

  // Montreal approximate coordinates: 45.5N
  // Seasonal adjustment
  const seasonalShift = Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 2;

  // Base times for Montreal (winter)
  let sunriseHour = 7.5 - seasonalShift;
  let sunsetHour = 16.5 + seasonalShift;

  // Clamp to reasonable values
  sunriseHour = Math.max(5, Math.min(8, sunriseHour));
  sunsetHour = Math.max(16, Math.min(21, sunsetHour));

  return {
    sunrise: sunriseHour,
    sunset: sunsetHour,
  };
}

/**
 * Determine if it's currently "night time" for navigation purposes
 * Returns true if it's dark or getting dark
 */
export function isNightTime(latitude = 45.5, date = new Date()) {
  const { sunrise, sunset } = getSunTimes(latitude, date);
  const currentHour = date.getHours() + date.getMinutes() / 60;

  // Consider it "night" from 30 min before sunset to 30 min after sunrise
  const nightStart = sunset - 0.5;
  const nightEnd = sunrise + 0.5;

  return currentHour >= nightStart || currentHour <= nightEnd;
}

/**
 * Get recommended mode based on current time
 */
export function getRecommendedMode(latitude = 45.5, date = new Date()) {
  return isNightTime(latitude, date) ? "night" : "day";
}

/**
 * Get time until next mode change
 */
export function getTimeUntilModeChange(latitude = 45.5, date = new Date()) {
  const { sunrise, sunset } = getSunTimes(latitude, date);
  const currentHour = date.getHours() + date.getMinutes() / 60;

  let hoursUntilChange;
  let nextMode;

  if (currentHour < sunrise) {
    hoursUntilChange = sunrise - currentHour;
    nextMode = "day";
  } else if (currentHour < sunset) {
    hoursUntilChange = sunset - currentHour;
    nextMode = "night";
  } else {
    hoursUntilChange = 24 - currentHour + sunrise;
    nextMode = "day";
  }

  return {
    hours: Math.floor(hoursUntilChange),
    minutes: Math.round((hoursUntilChange % 1) * 60),
    nextMode,
  };
}

/**
 * Get time of day context for personalization
 */
export function getTimeContext(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 9) {
    return {
      period: "early_morning",
      label: "Early Morning",
      suggestions: ["cafe", "gym"],
      priority: "convenience",
    };
  } else if (hour >= 9 && hour < 12) {
    return {
      period: "morning",
      label: "Morning",
      suggestions: ["cafe", "cowork", "library"],
      priority: "productivity",
    };
  } else if (hour >= 12 && hour < 14) {
    return {
      period: "midday",
      label: "Midday",
      suggestions: ["restaurant", "cafe"],
      priority: "convenience",
    };
  } else if (hour >= 14 && hour < 17) {
    return {
      period: "afternoon",
      label: "Afternoon",
      suggestions: ["cafe", "library", "cowork"],
      priority: "productivity",
    };
  } else if (hour >= 17 && hour < 20) {
    return {
      period: "evening",
      label: "Evening",
      suggestions: ["restaurant", "gym", "bar"],
      priority: "leisure",
    };
  } else if (hour >= 20 && hour < 23) {
    return {
      period: "night",
      label: "Night",
      suggestions: ["bar", "restaurant"],
      priority: "safety",
    };
  } else {
    return {
      period: "late_night",
      label: "Late Night",
      suggestions: [],
      priority: "safety",
    };
  }
}

/**
 * Format time for display
 */
export function formatTimeOfDay(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default {
  getSunTimes,
  isNightTime,
  getRecommendedMode,
  getTimeUntilModeChange,
  getTimeContext,
  formatTimeOfDay,
};
