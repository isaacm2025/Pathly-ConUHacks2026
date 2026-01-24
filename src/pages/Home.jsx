import { useState, useEffect } from "react";
import useLiveLocation from "../hooks/useLiveLocation";
import { fetchNearbyPlaces, fetchRoutes } from "../api/pathlyApi";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/shared/TopBar";
import SearchBar from "../components/day/SearchBar";
import FilterChips from "../components/day/FilterChips";
import PlacesList from "../components/day/PlacesList";
import MapView from "../components/map/MapView";
import RouteCard from "../components/night/RouteCard";
import SafetyToggles from "../components/night/SafetyToggles";
import DestinationBar from "../components/night/DestinationBar";
import SafetyAlert from "../components/night/SafetyAlert";
import TurnByTurnPanel from "../components/night/TurnByTurnPanel";
import ShareRouteModal from "../components/night/ShareRouteModal";
import useStreetActivity from "../hooks/useStreetActivity";
// Mock data for demonstration
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
};

export default function Home() {
  const { location: liveLocation, error: locationError } = useLiveLocation(montrealCenter);
  const { streetActivity, error: streetError } = useStreetActivity();
  const [mode, setMode] = useState("day");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState("1");
  const [safetyToggles, setSafetyToggles] = useState(["well_lit", "busy_areas"]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const isDark = mode === "night";
  const scopedLocation = isWithinMontreal(liveLocation) ? liveLocation : montrealCenter;
  
  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Show safety alert periodically in night mode
  useEffect(() => {
    if (isDark) {
      const timeout = setTimeout(() => {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 4000);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isDark]);
  
  const handleModeToggle = () => {
    setMode(mode === "day" ? "night" : "day");
  };
  
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
              <div className="mb-3">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search places..."
                />
              </div>

              <div className="mb-4">
                <FilterChips 
                  activeFilters={activeFilters}
                  onToggle={handleFilterToggle}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                <PlacesList 
                  places={sortedPlaces}
                  highlightedId={highlightedId}
                  onHover={setHighlightedId}
                />
              </div>
            </div>
            
            {/* Right Panel - Map */}
            <div className="flex-1">
              <MapView 
                  places={sortedPlaces}
                  highlightedId={highlightedId}
                  onMarkerHover={setHighlightedId}
                  isDark={false}
                  userLocation={scopedLocation}
                  mapCenter={montrealCenter}
                  zoom={13}
                  streetActivity={streetActivity}
                />
              {streetError && (
                <div className="mt-2 text-xs text-rose-600">
                  Street overlay failed to load. Please try again.
                </div>
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
            
            {/* Left Panel - Routes & Navigation */}
            <div className="w-[400px] flex flex-col gap-4 flex-shrink-0">
              {!selectedRoute ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Routes</h2>
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
              />
              {streetError && (
                <div className="mt-2 text-xs text-rose-200">
                  Street overlay failed to load. Please try again.
                </div>
              )}
              {locationError && <div style={{ color: 'red', textAlign: 'center' }}>{locationError}</div>}
            </div>
            
            {/* Destination Bar */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}