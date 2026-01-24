import { useState, useEffect, useCallback, useRef } from "react";
import useLiveLocation from "../hooks/useLiveLocation";
import { useUserPreferences, PreferencesProvider } from "../hooks/useUserPreferences";
import { fetchNearbyPlaces, fetchNearbyPlacesFromGoogle, fetchRoutes } from "../api/pathlyApi";
import { rankPlaces, calculateRouteSafetyScore, getSegmentColors, generateRouteDescription } from "../utils/ranking";
import { isNightTime, getRecommendedMode, getTimeContext } from "../utils/timeAware";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/shared/TopBar";
<<<<<<< HEAD
import SearchBar from "../components/day/SearchBar";
=======
import ComfortProfileSheet from "../components/shared/ComfortProfileSheet";
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
import FilterChips from "../components/day/FilterChips";
import PlacesList from "../components/day/PlacesList";
import MapView from "../components/map/MapView";
import RouteCard from "../components/night/RouteCard";
import SafetyToggles from "../components/night/SafetyToggles";
import DestinationBar from "../components/night/DestinationBar";
import DestinationSearch from "../components/night/DestinationSearch";
import SafetyAlert from "../components/night/SafetyAlert";
import TurnByTurnPanel from "../components/night/TurnByTurnPanel";
import ShareRouteModal from "../components/night/ShareRouteModal";
import useStreetActivity from "../hooks/useStreetActivity";
<<<<<<< HEAD
// Mock data for demonstration
=======

// Montreal configuration
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
const montrealCenter = [45.5019, -73.5674];
const montrealBounds = {
  north: 45.57,
  south: 45.44,
  east: -73.49,
  west: -73.73,
};

const isWithinMontreal = (location) => {
  const [lat, lng] = location;
  return (
    lat <= montrealBounds.north &&
    lat >= montrealBounds.south &&
    lng <= montrealBounds.east &&
    lng >= montrealBounds.west
  );
};

<<<<<<< HEAD
const mockPlaces = [
  { id: "1", name: "Crew Collective Cafe", type: "cafe", status: "not_busy", eta_minutes: 6, latitude: 45.5022, longitude: -73.5560 },
  { id: "2", name: "Nautilus Plus", type: "gym", status: "moderate", eta_minutes: 11, latitude: 45.5012, longitude: -73.5755 },
  { id: "3", name: "Grande Bibliotheque", type: "library", status: "not_busy", eta_minutes: 9, latitude: 45.5165, longitude: -73.5619 },
  { id: "4", name: "WeWork Place Ville Marie", type: "cowork", status: "busy", eta_minutes: 14, latitude: 45.5007, longitude: -73.5702 },
  { id: "5", name: "Cafe Olimpico", type: "cafe", status: "moderate", eta_minutes: 8, latitude: 45.5233, longitude: -73.6007 },
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

const mockDestination = {
  label: "Home",
  latitude: 45.5095,
  longitude: -73.5670
=======
// Place type mapping for Google API
const PLACE_TYPE_MAP = {
  cafe: "cafe",
  gym: "gym",
  library: "library",
  cowork: "coworking_space",
  restaurant: "restaurant",
  bar: "bar",
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
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

// Generate routes with safety scoring based on street activity
function generateScoredRoutes(origin, destination, streetActivity, userPreferences) {
  if (!destination) return [];
  const [originLat, originLng] = origin;
  const destLat = destination.latitude;
  const destLng = destination.longitude;

  const directPath = [[originLat, originLng], [(originLat + destLat) / 2, (originLng + destLng) / 2], [destLat, destLng]];
  const safePath = [[originLat, originLng], [originLat + 0.005, originLng - 0.005], [(originLat + destLat) / 2 + 0.003, (originLng + destLng) / 2], [destLat - 0.002, destLng + 0.003], [destLat, destLng]];
  const balancedPath = [[originLat, originLng], [originLat + 0.002, originLng - 0.002], [(originLat + destLat) / 2, (originLng + destLng) / 2 + 0.002], [destLat, destLng]];

  const routes = [
    { id: "1", type: "safest", path: safePath, eta: 14, baseSafetyScore: 90 },
    { id: "2", type: "balanced", path: balancedPath, eta: 11, baseSafetyScore: 75 },
    { id: "3", type: "fastest", path: directPath, eta: 8, baseSafetyScore: 60 },
  ];

  return routes.map(route => {
    const safetyScore = calculateRouteSafetyScore(route, streetActivity, userPreferences);
    const segmentColors = getSegmentColors(route, streetActivity, userPreferences);
    const description = generateRouteDescription(route, streetActivity, userPreferences);
    return { ...route, safetyScore: Math.round((route.baseSafetyScore + safetyScore) / 2), segmentColors, description };
  });
}

function HomeContent() {
  const { location: liveLocation, error: locationError } = useLiveLocation(montrealCenter);
<<<<<<< HEAD
  const { streetActivity, error: streetError } = useStreetActivity();
  const [mode, setMode] = useState("day");
  const [searchQuery, setSearchQuery] = useState("");
=======
  // @ts-ignore - bounds is valid
  const { streetActivity, error: streetError } = useStreetActivity({
    bounds: montrealBounds,
    center: montrealCenter,
  });

  const { preferences, recordRouteSelection } = useUserPreferences();

  // Auto-detect initial mode based on time
  const [mode, setMode] = useState(() => getRecommendedMode(montrealCenter[0]));
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);

>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
  const [activeFilters, setActiveFilters] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState("1");
  const [safetyToggles, setSafetyToggles] = useState(["well_lit", "busy_areas"]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
<<<<<<< HEAD
  const [showShareModal, setShowShareModal] = useState(false);
=======
  const [showPreferences, setShowPreferences] = useState(false);

  // Data states
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
  const [places, setPlaces] = useState([]);
  const [rankedPlaces, setRankedPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
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
    console.log("Map loaded in Home, saving reference");
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
        console.log("Fetching places from Google Places API...");
        results = await fetchNearbyPlacesFromGoogle(mapInstance, scopedLocation[0], scopedLocation[1], placeType, 1500);
      } else {
        console.log("Map not ready, using fallback...");
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

      console.log("Loaded", transformedPlaces.length, "places");
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

  // Generate routes when destination changes
  useEffect(() => {
    if (destination && mode === "night") {
      const scoredRoutes = generateScoredRoutes(scopedLocation, destination, streetActivity, preferences);
      setRoutes(scoredRoutes);
      setSelectedRouteId("1");
    }
  }, [destination, scopedLocation, streetActivity, preferences, mode]);

  // Generate route when place is selected in Day mode
  useEffect(() => {
    if (selectedPlace && mode === "day") {
      const [originLat, originLng] = scopedLocation;
      const destLat = selectedPlace.latitude;
      const destLng = selectedPlace.longitude;

      // Guard against missing coordinates
      if (!destLat || !destLng) {
        console.warn("Selected place missing coordinates:", selectedPlace);
        setDayModeRoute(null);
        return;
      }

      // Create a simple direct route path
      const routePath = [
        [originLat, originLng],
        [originLat + (destLat - originLat) * 0.33, originLng + (destLng - originLng) * 0.33],
        [originLat + (destLat - originLat) * 0.66, originLng + (destLng - originLng) * 0.66],
        [destLat, destLng]
      ];

      console.log("Creating day mode route:", { origin: [originLat, originLng], dest: [destLat, destLng], path: routePath });

      setDayModeRoute({
        id: "day-route",
        type: "walking",
        path: routePath,
        eta: selectedPlace.eta_minutes,
        destination: selectedPlace
      });
    } else {
      setDayModeRoute(null);
    }
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
  const handleRouteSelect = (routeId) => { setSelectedRouteId(routeId); const route = routes.find(r => r.id === routeId); if (route) recordRouteSelection(route.type); };
  const handleDestinationSelect = (dest) => setDestination(dest);
  const handlePlaceSelect = (place) => {
    console.log("Place selected:", place);
    // Toggle selection - if same place clicked, deselect it
    setSelectedPlace(prev => {
      const newValue = prev?.id === place.id ? null : place;
      console.log("Setting selectedPlace to:", newValue);
      return newValue;
    });
  };
<<<<<<< HEAD
  
  const handleFilterToggle = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };
  
  const handleSafetyToggle = (toggleId) => {
    setSafetyToggles(prev =>
      prev.includes(toggleId)
        ? prev.filter(t => t !== toggleId)
        : [...prev, toggleId]
    );
  };
  
  // Filter places based on search query and active filters
  const filteredPlaces = places.filter(place => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = place.name.toLowerCase().includes(query);
      const matchesType = place.type.toLowerCase().includes(query);
      if (!matchesName && !matchesType) return false;
    }
    
    // Active filters
    if (activeFilters.length > 0) {
      if (activeFilters.includes("distance") && place.eta_minutes > 10) return false;
      if (activeFilters.includes("low_crowd") && place.status === "busy") return false;
      if (activeFilters.includes("cafe") && place.type !== "cafe") return false;
      if (activeFilters.includes("gym") && place.type !== "gym") return false;
    }
    
    return true;
  });
  
  const sortedPlaces = filteredPlaces;
=======
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178

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
<<<<<<< HEAD
              <div className="mb-3">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search places..."
                />
=======
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
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
              </div>

              <div className="mb-4">
                <FilterChips
                  activeFilters={activeFilters}
                  onToggle={handleFilterToggle}
                />
              </div>

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
            <div className="flex-1 flex flex-col">
              <MapView
                places={rankedPlaces}
                highlightedId={highlightedId}
                onMarkerHover={setHighlightedId}
                onMapLoad={handleMapLoad}
                isDark={false}
                userLocation={scopedLocation}
                mapCenter={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : montrealCenter}
                zoom={selectedPlace ? 15 : 14}
                streetActivity={streetActivity}
                routes={[]}
                selectedRouteId={null}
                destination={selectedPlace ? { latitude: selectedPlace.latitude, longitude: selectedPlace.longitude, label: selectedPlace.name } : null}
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
<<<<<<< HEAD
            
            {/* Left Panel - Routes & Navigation */}
            <div className="w-[420px] flex flex-col flex-shrink-0">
              {!selectedRoute ? (
                <>
                  <div className="mb-3">
                    <SearchBar 
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search places..."
                    />
                  </div>

                  <div className="mb-4">
                    <SafetyToggles 
                      active={safetyToggles}
                      onToggle={handleSafetyToggle}
                    />
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-1 -mr-1">
                    {routes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isSelected={selectedRouteId === route.id}
                        onSelect={setSelectedRouteId}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedRouteId(null)}
                    className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                  >
                    ← Back to routes
                  </button>
                  <TurnByTurnPanel 
                    route={selectedRoute}
                    destination={mockDestination}
                    onShare={() => setShowShareModal(true)}
                  />
                </>
              )}
            </div>
            
            {/* Right Panel - Map */}
            <div className="flex-1">
              <MapView 
                isDark={true}
                routes={mockRoutes}
                highlightedId={highlightedId}
                onMarkerHover={setHighlightedId}
                userLocation={scopedLocation}
                destination={mockDestination}
                mapCenter={montrealCenter}
                zoom={13}
                streetActivity={streetActivity}
=======

            {/* Left Panel - Routes */}
            <div className="w-[400px] flex flex-col gap-4 flex-shrink-0">
              {/* Destination Search */}
              <DestinationSearch
                onDestinationSelect={handleDestinationSelect}
                isDark={true}
                currentDestination={destination}
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
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
                    {routes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isSelected={selectedRouteId === route.id}
                        onSelect={handleRouteSelect}
                      />
                    ))}
                  </div>

                  {/* Route Explanation */}
                  {selectedRoute && (
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Why this route?</h3>
                      <p className="text-sm text-slate-400">{selectedRoute.description}</p>
                      <div className="flex gap-2 mt-3">
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
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <span className="text-3xl">🌙</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Night Mode</h2>
                  <p className="text-slate-400 max-w-xs">
                    Enter a destination above to see confidence-focused route options with safety scoring.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="flex-1">
              <MapView
                isDark={true}
                routes={routes}
                selectedRouteId={selectedRouteId}
                userLocation={scopedLocation}
                destination={destination}
                mapCenter={montrealCenter}
                zoom={14}
                streetActivity={streetActivity}
                highlightedId={null}
                onMarkerHover={() => {}}
                onMapLoad={handleMapLoad}
              />
              {streetError && (
                <div className="mt-2 text-xs text-rose-200">Street overlay failed to load. Please try again.</div>
              )}
              {locationError && (
                <div className="mt-2 text-xs text-amber-200">Using default location. {locationError}</div>
              )}
            </div>

            {/* Destination Bar */}
<<<<<<< HEAD
            <DestinationBar 
              destination={mockDestination}
              eta={selectedRoute?.eta}
              routeType={selectedRoute?.type}
            />
            
            {/* Share Route Modal */}
            <ShareRouteModal 
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              route={selectedRoute}
              destination={mockDestination}
            />
=======
            {destination && (
              <DestinationBar
                destination={destination}
                eta={selectedRoute?.eta}
                routeType={selectedRoute?.type}
              />
            )}
>>>>>>> b919bd9aa9a5626e65709c35520b689ff5eda178
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Sheet */}
      <ComfortProfileSheet
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        isDark={isDark}
      />
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
