import { useState, useEffect, createContext, useContext } from "react";

// Preference defaults
const DEFAULT_PREFERENCES = {
  // Explicit preferences
  preferWellLit: true,
  preferBusyStreets: true,
  avoidIsolated: true,
  speedVsSafety: 0.5, // 0 = full safety, 1 = full speed

  // Inferred comfort profile
  comfortProfile: "balanced", // "cautious", "balanced", "speed-focused"

  // Route history for inference
  routeHistory: [],
};

const COMFORT_PROFILES = {
  cautious: {
    label: "Cautious",
    description: "Prioritizes lighting & activity",
    weights: { lighting: 0.4, activity: 0.4, speed: 0.2 },
    icon: "🛡️",
  },
  balanced: {
    label: "Balanced",
    description: "Equal weight on speed & comfort",
    weights: { lighting: 0.33, activity: 0.33, speed: 0.34 },
    icon: "⚖️",
  },
  "speed-focused": {
    label: "Speed-Focused",
    description: "Prioritizes fastest route",
    weights: { lighting: 0.15, activity: 0.15, speed: 0.7 },
    icon: "⚡",
  },
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem("pathly_preferences");
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem("pathly_preferences", JSON.stringify(preferences));
  }, [preferences]);

  // Update a single preference
  const updatePreference = (key, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-infer comfort profile based on preferences
      updated.comfortProfile = inferComfortProfile(updated);
      return updated;
    });
  };

  // Toggle a boolean preference
  const togglePreference = (key) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      updated.comfortProfile = inferComfortProfile(updated);
      return updated;
    });
  };

  // Record a route selection for inference
  const recordRouteSelection = (routeType) => {
    setPreferences(prev => {
      const history = [...prev.routeHistory, { type: routeType, timestamp: Date.now() }].slice(-20);
      const updated = { ...prev, routeHistory: history };
      updated.comfortProfile = inferComfortProfile(updated);
      return updated;
    });
  };

  // Set comfort profile explicitly
  const setComfortProfile = (profile) => {
    setPreferences(prev => ({ ...prev, comfortProfile: profile }));
  };

  // Get current weights based on profile
  const getWeights = () => {
    return COMFORT_PROFILES[preferences.comfortProfile]?.weights || COMFORT_PROFILES.balanced.weights;
  };

  // Reset preferences
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem("pathly_preferences");
  };

  return (
    <PreferencesContext.Provider value={{
      preferences,
      updatePreference,
      togglePreference,
      recordRouteSelection,
      setComfortProfile,
      getWeights,
      resetPreferences,
      COMFORT_PROFILES,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within PreferencesProvider");
  }
  return context;
}

// Infer comfort profile from preferences and history
function inferComfortProfile(prefs) {
  // Calculate scores for each profile
  let cautiousScore = 0;
  let balancedScore = 0;
  let speedScore = 0;

  // Score based on explicit preferences
  if (prefs.preferWellLit) cautiousScore += 2;
  if (prefs.preferBusyStreets) cautiousScore += 2;
  if (prefs.avoidIsolated) cautiousScore += 2;

  // Score based on speed slider
  if (prefs.speedVsSafety < 0.35) cautiousScore += 3;
  else if (prefs.speedVsSafety > 0.65) speedScore += 3;
  else balancedScore += 3;

  // Score based on route history
  const recentRoutes = prefs.routeHistory.slice(-5);
  recentRoutes.forEach(route => {
    if (route.type === "safest") cautiousScore += 1;
    else if (route.type === "fastest") speedScore += 1;
    else balancedScore += 1;
  });

  // Determine profile
  if (cautiousScore > speedScore && cautiousScore > balancedScore) return "cautious";
  if (speedScore > cautiousScore && speedScore > balancedScore) return "speed-focused";
  return "balanced";
}

export default useUserPreferences;
