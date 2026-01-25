import { useState, useEffect, useCallback } from "react";
import useLiveLocation from "../hooks/useLiveLocation";
import { useUserPreferences, PreferencesProvider } from "../hooks/useUserPreferences";
import { fetchNearbyPlaces, fetchNearbyPlacesFromGoogle } from "../api/pathlyApi";
import { rankPlaces } from "../utils/ranking";
import {
  fetchWalkingRoutes,
  classifyRoutes,
  getRouteSegmentColors,
  generateDescription,
} from "../utils/routingService";
import { getRecommendedMode, getTimeContext } from "../utils/timeAware";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/shared/TopBar";
import ComfortProfileSheet from "../components/shared/ComfortProfileSheet";
import FilterChips from "../components/day/FilterChips";
import PlacesList from "../components/day/PlacesList";
import MapView from "../components/map/MapView";
import AISuggestionButton from "../components/map/AISuggestionButton";
import AIOverview from "../components/ai/AIOverview";
import RouteCard from "../components/night/RouteCard";
import SafetyToggles from "../components/night/SafetyToggles";
import DestinationBar from "../components/night/DestinationBar";
import DestinationSearch from "../components/night/DestinationSearch";
import SafetyAlert from "../components/night/SafetyAlert";
import NightSafetyPanel from "../components/night/NightSafetyPanel";
import NightQuickStats from "../components/night/NightQuickStats";
import StreetViewPreview from "../components/map/StreetViewPreview";
import VoiceNavigator from "../components/navigation/VoiceNavigator";
import useStreetActivity from "../hooks/useStreetActivity";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";

// Montreal configuration - downtown area only for performance
const montrealCenter = [45.5019, -73.5674];
const montrealBounds = {
  north: 45.52,
  south: 45.49,
  east: -73.54,
  west: -73.59,
};

// Only fetch main roads (not every tiny service road)
const MAIN_ROAD_TYPES = [
  "primary",
  "secondary",
  "tertiary",
  "residential",
];

const isWithinMontreal = (location) => {
  const [lat, lng] = location;
  return (
    lat <= montrealBounds.north &&
    lat >= montrealBounds.south &&
    lng <= montrealBounds.east &&
    lng >= montrealBounds.west
  );
};

// Place type mapping for Google API
const PLACE_TYPE_MAP = {
  cafe: "cafe",
  gym: "gym",
  library: "library",
  cowork: "coworking_space",
  restaurant: "restaurant",
  bar: "bar",
};

// Utility functions
function estimateCrowdLevel(place) {
  if (place.opening_hours?.open_now === false) return "not_busy";
  const rating = place.rating || 3.5;
  const priceLevel = place.price_level || 2;
  const busynessScore = (rating / 5) * 0.6 + (1 - priceLevel / 4) * 0.4;
  if (busynessScore > 0.7) return "busy";
  if (busynessScore > 0.4) return "moderate";
  return "not_busy";
}

function estimateETA(origin, destination) {
  if (!destination || !destination[0] || !destination[1]) return 10;
  const [lat1, lng1] = origin;
  const [lat2, lng2] = destination;
  const distance = Math.sqrt(Math.pow((lat2 - lat1) * 111, 2) + Math.pow((lng2 - lng1) * 85, 2));
  const etaMinutes = Math.round((distance / 5) * 60);
  return Math.max(1, Math.min(30, etaMinutes));
}

function getMockPlaces() {
  return [
    { id: "1", name: "Crew Collective Cafe", type: "cafe", status: "not_busy", eta_minutes: 6, latitude: 45.5022, longitude: -73.5560, rating: 4.5, open: true },
    { id: "2", name: "Nautilus Plus", type: "gym", status: "moderate", eta_minutes: 11, latitude: 45.5012, longitude: -73.5755, rating: 4.2, open: true },
    { id: "3", name: "Grande Bibliotheque", type: "library", status: "not_busy", eta_minutes: 9, latitude: 45.5165, longitude: -73.5619, rating: 4.6, open: true },
    { id: "4", name: "WeWork Place Ville Marie", type: "cowork", status: "busy", eta_minutes: 14, latitude: 45.5007, longitude: -73.5702, rating: 4.0, open: true },
    { id: "5", name: "Cafe Olimpico", type: "cafe", status: "moderate", eta_minutes: 8, latitude: 45.5233, longitude: -73.6007, rating: 4.4, open: true },
  ];
}

// Generate fallback routes when Google API fails (simple interpolated paths)
function generateFallbackRoutes(origin, destination, streetActivity, userPreferences) {
  if (!destination) return [];
  const [originLat, originLng] = origin;
  const destLat = destination.latitude;
  const destLng = destination.longitude;

  // Calculate approximate distance and ETA
  const distance = Math.sqrt(
    Math.pow((destLat - originLat) * 111, 2) +
    Math.pow((destLng - originLng) * 85, 2)
  );
  const baseEta = Math.round((distance / 5) * 60); // 5 km/h walking speed

  const directPath = [[originLat, originLng], [(originLat + destLat) / 2, (originLng + destLng) / 2], [destLat, destLng]];

  const routes = [
    { id: "1", type: "safest", path: directPath, eta: baseEta, baseSafetyScore: 70, description: "Route calculated (limited data)" },
  ];

  return routes.map(route => {
    const segmentColors = getRouteSegmentColors(route, streetActivity, userPreferences);
    return { ...route, safetyScore: route.baseSafetyScore, segmentColors };
  });
}

function HomeContent() {
  const { location: liveLocation, error: locationError } = useLiveLocation(montrealCenter);
  // @ts-ignore - bounds is valid
  const { streetActivity, error: streetError } = useStreetActivity({
    bounds: montrealBounds,
    center: montrealCenter,
    roadTypes: MAIN_ROAD_TYPES,
  });

  const { preferences, recordRouteSelection } = useUserPreferences();

  // Log route history when route is selected
  const logHistoryMutation = useMutation({
    mutationFn: (historyData) => base44.entities.RouteHistory.create(historyData),
  });

  // Auto-detect initial mode based on time
  const [mode, setMode] = useState(() => getRecommendedMode(montrealCenter[0]));
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);

  const [activeFilters, setActiveFilters] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState("1");
  const [safetyToggles, setSafetyToggles] = useState(["well_lit", "busy_areas"]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);

  // Data states
  const [places, setPlaces] = useState([]);
  const [rankedPlaces, setRankedPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [destination, setDestination] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dayModeRoute, setDayModeRoute] = useState(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const isDark = mode === "night";
  const scopedLocation = isWithinMontreal(liveLocation) ? liveLocation : montrealCenter;
  const timeContext = getTimeContext();

  // Callback when map loads
  const handleMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  // Auto mode switching based on time
  useEffect(() => {
    if (!autoModeEnabled) return;
    const checkMode = () => {
      const recommended = getRecommendedMode(scopedLocation[0]);
      if (recommended !== mode) setMode(recommended);
    };
    const interval = setInterval(checkMode, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoModeEnabled, scopedLocation, mode]);

  // Live updates for places
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch nearby places - uses Google Places API when map is available
  const fetchPlacesData = useCallback(async () => {
    setIsLoadingPlaces(true);
    try {
      let placeType = "";
      const typeFilters = activeFilters.filter(f => ["cafe", "gym", "library", "cowork"].includes(f));
      if (typeFilters.length === 1) placeType = PLACE_TYPE_MAP[typeFilters[0]] || typeFilters[0];

      let results;

      // Use Google Places API if map is available
      if (mapInstance) {
        results = await fetchNearbyPlacesFromGoogle(mapInstance, scopedLocation[0], scopedLocation[1], placeType, 1500);
      } else {
        results = await fetchNearbyPlaces(scopedLocation[0], scopedLocation[1], placeType, 1500, false);
      }

      const transformedPlaces = results.map((place, index) => {
        // Handle both Google Places API format and mock data format
        const lat = place.geometry?.location?.lat?.() ?? place.geometry?.location?.lat ?? place.latitude;
        const lng = place.geometry?.location?.lng?.() ?? place.geometry?.location?.lng ?? place.longitude;

        return {
          id: place.place_id || `place-${index}`,
          place_id: place.place_id,
          name: place.name,
          type: place.types?.[0] || place.type || "other",
          types: place.types,
          status: estimateCrowdLevel(place),
          eta_minutes: estimateETA(scopedLocation, [lat, lng]),
          latitude: lat,
          longitude: lng,
          rating: place.rating,
          open: place.opening_hours?.isOpen?.() ?? place.opening_hours?.open_now ?? place.open,
          vicinity: place.vicinity,
          priceLevel: place.price_level,
        };
      });

      setPlaces(transformedPlaces);
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces(getMockPlaces());
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [scopedLocation, activeFilters, mapInstance]);

  // Fetch places when map loads or filters change
  useEffect(() => {
    if (mode === "day") {
      fetchPlacesData();
    }
  }, [fetchPlacesData, mode, mapInstance]);

  // Rank places when data or preferences change
  useEffect(() => {
    const ranked = rankPlaces(places, preferences, activeFilters);
    setRankedPlaces(ranked);
  }, [places, preferences, activeFilters]);

  // Generate routes when destination changes - uses Google Directions API
  useEffect(() => {
    if (!destination || mode !== "night") {
      setRoutes([]);
      return;
    }

    let cancelled = false;

    async function fetchRoutes() {
      setIsLoadingRoutes(true);
      try {
        // Fetch real walking routes from Google Directions API
        const googleRoutes = await fetchWalkingRoutes(scopedLocation, destination);

        if (cancelled) return;

        // Classify routes by safety score
        const classifiedRoutes = classifyRoutes(googleRoutes, streetActivity, preferences);

        // Add segment colors and descriptions
        const enrichedRoutes = classifiedRoutes.map(route => ({
          ...route,
          segmentColors: getRouteSegmentColors(route, streetActivity, preferences),
          description: generateDescription(route, streetActivity),
        }));

        setRoutes(enrichedRoutes);
        // Only set initial selection when destination changes, not on every update
        setSelectedRouteId(prev => {
          // If we already have a valid selection that exists in new routes, keep it
          const prevExists = enrichedRoutes.some(r => r.id === prev);
          if (prevExists) return prev;
          // Otherwise select the first (safest) route
          return enrichedRoutes[0]?.id || "1";
        });
      } catch (error) {
        console.error("Error fetching routes:", error);
        // Fall back to simple routes if Google API fails
        if (!cancelled) {
          const fallbackRoutes = generateFallbackRoutes(scopedLocation, destination, streetActivity, preferences);
          setRoutes(fallbackRoutes);
          setSelectedRouteId(prev => prev || "1");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoutes(false);
        }
      }
    }

    fetchRoutes();

    return () => {
      cancelled = true;
    };
  }, [destination, scopedLocation, mode]); // Removed streetActivity and preferences to prevent re-fetching

  // Update route safety scores and colors when streetActivity or preferences change
  useEffect(() => {
    if (routes.length === 0) return;

    // Re-score existing routes with updated activity data
    const updatedRoutes = routes.map(route => ({
      ...route,
      safetyScore: route.safetyScore, // Keep existing score for now
      segmentColors: getRouteSegmentColors(route, streetActivity, preferences),
      description: generateDescription(route, streetActivity),
    }));

    setRoutes(updatedRoutes);
  }, [streetActivity, preferences]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate route when place is selected in Day mode - uses Google Directions API
  useEffect(() => {
    if (!selectedPlace || mode !== "day") {
      setDayModeRoute(null);
      return;
    }

    const destLat = selectedPlace.latitude;
    const destLng = selectedPlace.longitude;

    // Guard against missing coordinates
    if (!destLat || !destLng) {
      console.warn("Selected place missing coordinates:", selectedPlace);
      setDayModeRoute(null);
      return;
    }

    let cancelled = false;

    async function fetchDayRoute() {
      try {
        const destination = { latitude: destLat, longitude: destLng };
        const googleRoutes = await fetchWalkingRoutes(scopedLocation, destination);

        if (cancelled || !googleRoutes.length) return;

        // Use the first (usually fastest) route for day mode
        const route = googleRoutes[0];
        setDayModeRoute({
          id: "day-route",
          type: "walking",
          path: route.path,
          eta: route.eta,
          distance: route.distanceText,
          destination: selectedPlace
        });
      } catch (error) {
        console.error("Error fetching day route:", error);
        // Fallback to simple interpolated path
        if (!cancelled) {
          const [originLat, originLng] = scopedLocation;
          const routePath = [
            [originLat, originLng],
            [originLat + (destLat - originLat) * 0.33, originLng + (destLng - originLng) * 0.33],
            [originLat + (destLat - originLat) * 0.66, originLng + (destLng - originLng) * 0.66],
            [destLat, destLng]
          ];
          setDayModeRoute({
            id: "day-route",
            type: "walking",
            path: routePath,
            eta: selectedPlace.eta_minutes,
            destination: selectedPlace
          });
        }
      }
    }

    fetchDayRoute();

    return () => {
      cancelled = true;
    };
  }, [selectedPlace, scopedLocation, mode]);

  // Show safety alert periodically in night mode
  useEffect(() => {
    if (isDark && destination) {
      const timeout = setTimeout(() => {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 4000);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isDark, destination]);

  const handleModeToggle = () => { setAutoModeEnabled(false); setMode(mode === "day" ? "night" : "day"); setSelectedPlace(null); };
  const handleFilterToggle = (filterId) => setActiveFilters(prev => prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]);
  const handleSafetyToggle = (toggleId) => setSafetyToggles(prev => prev.includes(toggleId) ? prev.filter(t => t !== toggleId) : [...prev, toggleId]);
  const handleRouteSelect = (routeId) => { 
    setSelectedRouteId(routeId); 
    const route = routes.find(r => r.id === routeId); 
    if (route) {
      recordRouteSelection(route.type);
      // Log to history in night mode
      if (mode === "night" && destination) {
        logHistoryMutation.mutate({
          origin_lat: scopedLocation[0],
          origin_lng: scopedLocation[1],
          origin_label: "Current Location",
          dest_lat: destination.latitude,
          dest_lng: destination.longitude,
          dest_label: destination.label,
          route_type: route.type,
          mode: "night",
          eta_minutes: route.eta,
        });
      }
    }
  };
  const handleDestinationSelect = (dest) => setDestination(dest);
  const handlePlaceSelect = (place) => {
    // Toggle selection - if same place clicked, deselect it
    setSelectedPlace(prev => {
      const newValue = prev?.id === place.id ? null : place;
      // Log to history when a place is selected in day mode
      if (newValue && mode === "day") {
        logHistoryMutation.mutate({
          origin_lat: scopedLocation[0],
          origin_lng: scopedLocation[1],
          origin_label: "Current Location",
          dest_lat: place.latitude,
          dest_lng: place.longitude,
          dest_label: place.name,
          route_type: "walking",
          mode: "day",
          eta_minutes: place.eta_minutes,
        });
      }
      return newValue;
    });
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className={`
      min-h-screen transition-colors duration-500
      ${isDark ? "bg-slate-900" : "bg-slate-50"}
    `}>
      <TopBar
        mode={mode}
        onModeToggle={handleModeToggle}
        lastUpdate={lastUpdate}
        isDark={isDark}
        onOpenPreferences={() => setShowPreferences(true)}
        autoModeEnabled={autoModeEnabled}
        timeContext={timeContext}
      />

      <AnimatePresence mode="wait">
        {mode === "day" ? (
          <motion.div
            key="day"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-row gap-4 p-4 h-[calc(100vh-64px)]"
          >
            {/* Left Panel - Places */}
            <div className="w-[420px] flex flex-col flex-shrink-0">
              {/* Time Context Header */}
              <div className="mb-3 px-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">{timeContext.label}</span>
                  {timeContext.suggestions.length > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">Suggested: {timeContext.suggestions.slice(0, 2).join(", ")}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <FilterChips
                  activeFilters={activeFilters}
                  onToggle={handleFilterToggle}
                />
              </div>

              {/* AI Overview Section */}
              <AIOverview 
                places={rankedPlaces} 
                timeContext={timeContext}
                isDark={false}
              />

              <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                {isLoadingPlaces ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <PlacesList
                    places={rankedPlaces}
                    highlightedId={highlightedId}
                    onHover={setHighlightedId}
                    onPlaceSelect={handlePlaceSelect}
                    selectedPlaceId={selectedPlace?.id}
                  />
                )}
              </div>

              {/* Recommendation Explanation */}
              {rankedPlaces.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-slate-100 text-sm text-slate-600">
                  <strong className="text-slate-700">Why this ranking?</strong>
                  <p className="mt-1">
                    Based on your preferences: {preferences.comfortProfile === "cautious"
                      ? "prioritizing less crowded spots"
                      : preferences.comfortProfile === "speed-focused"
                        ? "prioritizing closest locations"
                        : "balancing distance and crowd levels"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 flex flex-col relative">
              <MapView
                places={rankedPlaces}
                highlightedId={highlightedId}
                onMarkerHover={setHighlightedId}
                onMapLoad={handleMapLoad}
                isDark={false}
                userLocation={scopedLocation}
                mapCenter={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : scopedLocation}
                zoom={15}
                streetActivity={streetActivity}
                routes={[]}
                selectedRouteId={null}
                destination={selectedPlace ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude, label: selectedPlace.name } : null}
              />
              
              {/* AI Suggestion Button */}
              <AISuggestionButton 
                places={rankedPlaces} 
                isDark={false} 
                userLocation={scopedLocation}
              />

              {/* Route Info Card */}
              {selectedPlace && (
                <div className="mt-3 p-4 bg-white rounded-xl shadow-md border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">Walking to {selectedPlace.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">~{selectedPlace.eta_minutes} min walk</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        Open in Google Maps
                      </a>
                      <button
                        onClick={() => setSelectedPlace(null)}
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {streetError && (
                <div className="mt-2 text-xs text-rose-600">Street overlay failed to load. Please try again.</div>
              )}
              {locationError && (
                <div className="mt-2 text-xs text-amber-600">Using default location. {locationError}</div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="night"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-row gap-4 p-4 h-[calc(100vh-64px)]"
          >
            {/* Safety Alert */}
            <SafetyAlert
              message="Entering lower-activity area in 120m"
              isVisible={showAlert}
            />

            {/* Left Panel - Routes */}
            <div className="w-[400px] flex flex-col gap-4 flex-shrink-0">
              {/* Destination Search */}
              <DestinationSearch
                onDestinationSelect={handleDestinationSelect}
                isDark={true}
                currentDestination={destination}
              />

              {destination ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Routes to {destination.label}</h2>
                    <SafetyToggles
                      active={safetyToggles}
                      onToggle={handleSafetyToggle}
                    />
                  </div>

                  <div className="space-y-3 overflow-y-auto pr-1 -mr-1 flex-1">
                    {isLoadingRoutes ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                        <span className="ml-3 text-slate-400">Finding routes...</span>
                      </div>
                    ) : routes.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No routes found. Try a different destination.
                      </div>
                    ) : (
                      routes.map((route) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          isSelected={selectedRouteId === route.id}
                          onSelect={handleRouteSelect}
                        />
                      ))
                    )}
                  </div>

                  {/* Combined Route Info & Safety Panel */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                    {/* Route Explanation */}
                    {selectedRoute && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Why this route?</h3>
                        <p className="text-sm text-slate-400">{selectedRoute.description}</p>
                        <div className="flex gap-3 mt-3">
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-slate-500">Well-lit</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-slate-500">Moderate</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-slate-500">Low activity</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    {selectedRoute && <div className="border-t border-slate-700" />}

                    {/* Quick Safety Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-300">Safety Tools</h3>
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                          Area: 78%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => setShowStreetView(true)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-500/30"
                        >
                          <span className="text-purple-400 text-lg">👁️</span>
                          <span className="text-[10px] text-purple-300">Preview</span>
                        </button>
                        <button
                          onClick={() => window.location.href = "tel:911"}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/30"
                        >
                          <span className="text-rose-400 text-lg">📞</span>
                          <span className="text-[10px] text-rose-300">Emergency</span>
                        </button>
                        <button
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${scopedLocation[0]},${scopedLocation[1]}`;
                            navigator.clipboard.writeText(url);
                          }}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/30"
                        >
                          <span className="text-blue-400 text-lg">📍</span>
                          <span className="text-[10px] text-blue-300">Share</span>
                        </button>
                        <button
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600"
                        >
                          <span className="text-slate-400 text-lg">🔦</span>
                          <span className="text-[10px] text-slate-400">Light</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Empty State Header */}
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                      <span className="text-3xl">🌙</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Night Mode</h2>
                    <p className="text-slate-400 max-w-xs">
                      Enter a destination above to see confidence-focused route options with safety scoring.
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <NightQuickStats 
                    streetActivity={streetActivity}
                    userLocation={scopedLocation}
                  />

                  {/* Safety Tools */}
                  <NightSafetyPanel 
                    userLocation={scopedLocation}
                    destination={destination}
                    isDark={true}
                  />
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1 relative">
              <MapView
                isDark={true}
                routes={routes}
                selectedRouteId={selectedRouteId}
                userLocation={scopedLocation}
                destination={destination}
                mapCenter={scopedLocation}
                zoom={15}
                streetActivity={streetActivity}
                highlightedId={null}
                onMarkerHover={() => {}}
                onMapLoad={handleMapLoad}
              />
              
              {/* AI Suggestion Button */}
              <AISuggestionButton 
                places={[]} 
                isDark={true} 
                userLocation={scopedLocation}
              />
              
              {streetError && (
                <div className="mt-2 text-xs text-rose-200">Street overlay failed to load. Please try again.</div>
              )}
              {locationError && (
                <div className="mt-2 text-xs text-amber-200">Using default location. {locationError}</div>
              )}
            </div>

            {/* Destination Bar */}
            {destination && (
              <DestinationBar
                destination={destination}
                eta={selectedRoute?.eta}
                routeType={selectedRoute?.type}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Sheet */}
      <ComfortProfileSheet
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        isDark={isDark}
      />

      {/* Street View Preview Modal */}
      <AnimatePresence>
        {showStreetView && destination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowStreetView(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full">
              <StreetViewPreview
                location={{
                  lat: destination.latitude,
                  lng: destination.longitude,
                  label: destination.label
                }}
                routePoints={selectedRoute?.path?.slice(1, -1).filter((_, i) => i % 3 === 0).map((point, idx) => ({
                  lat: point[0],
                  lng: point[1],
                  label: `Checkpoint ${idx + 1}`
                })) || []}
                isDark={true}
                onClose={() => setShowStreetView(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Navigator - Only in Night Mode */}
      {isDark && destination && (
        <VoiceNavigator
          destination={destination?.label || destination?.name}
          route={selectedRoute}
          streetData={streetActivity}
          userLocation={scopedLocation}
        />
      )}
    </div>
  );
}

// Wrap with PreferencesProvider
export default function Home() {
  return (
    <PreferencesProvider>
      <HomeContent />
    </PreferencesProvider>
  );
}