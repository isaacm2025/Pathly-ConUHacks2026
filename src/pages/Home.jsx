import { useState, useEffect } from "react";
import useLiveLocation from "../hooks/useLiveLocation";
import { fetchNearbyPlaces, fetchRoutes } from "../api/pathlyApi";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/shared/TopBar";
import FilterChips from "../components/day/FilterChips";
import PlacesList from "../components/day/PlacesList";
import MapView from "../components/map/MapView";
import RouteCard from "../components/night/RouteCard";
import SafetyToggles from "../components/night/SafetyToggles";
import DestinationBar from "../components/night/DestinationBar";
import SafetyAlert from "../components/night/SafetyAlert";


const mockDestination = {
  label: "Home",
  latitude: 40.7180,
  longitude: -74.0070
};

export default function Home() {
  const { location: liveLocation, error: locationError } = useLiveLocation();
  const [mode, setMode] = useState("day");
  const [activeFilters, setActiveFilters] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState("1");
  const [safetyToggles, setSafetyToggles] = useState(["well_lit", "busy_areas"]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const isDark = mode === "night";
  
  // Fetch real Google Places nearby when location or filters change
  useEffect(() => {
    if (!liveLocation) return;
    const [lat, lng] = liveLocation;
    // Map filters to Google Places API supported params
    let type = '';
    let opennow = false;
    let radius = 3000; // Increase radius for more results
    activeFilters.forEach(f => {
      if (["cafe","gym","library","restaurant","bar"].includes(f)) type = f;
      if (f === "open_now") opennow = true;
    });
    fetchNearbyPlaces(lat, lng, type, radius, opennow).then(setPlaces);
  }, [liveLocation, activeFilters]);

  // Fetch live routes when location, destination, or toggles change
  useEffect(() => {
    if (!liveLocation) return;
    const [lat, lng] = liveLocation;
    const from = [lat, lng];
    const to = [mockDestination.latitude, mockDestination.longitude];
    const preferences = { toggles: safetyToggles.join(",") };
    fetchRoutes(from, to, preferences).then(setRoutes);
  }, [liveLocation, safetyToggles]);

  // Simulate live updates (refreshes data every 30s)
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
  
  // No extra filtering for unsupported criteria; just show all results from Google
  const sortedPlaces = places;

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
                  userLocation={liveLocation}
                />
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
            </div>
            
            {/* Right Panel - Map */}
            <div className="flex-1">
              <MapView 
                isDark={true}
                routes={routes}
                userLocation={liveLocation}
                destination={mockDestination}
                highlightedId={highlightedId}
                onMarkerHover={setHighlightedId}
              />
  {locationError && <div style={{ color: 'red', textAlign: 'center' }}>{locationError}</div>}
            </div>
            
            {/* Destination Bar */}
            <DestinationBar 
              destination={mockDestination}
              eta={selectedRoute?.eta}
              routeType={selectedRoute?.type}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}