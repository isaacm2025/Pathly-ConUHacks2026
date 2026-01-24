import { useState, useEffect } from "react";
import useLiveLocation from "../hooks/useLiveLocation";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "../components/shared/TopBar";
import FilterChips from "../components/day/FilterChips";
import PlacesList from "../components/day/PlacesList";
import MapView from "../components/map/MapView";
import RouteCard from "../components/night/RouteCard";
import SafetyToggles from "../components/night/SafetyToggles";
import DestinationBar from "../components/night/DestinationBar";
import SafetyAlert from "../components/night/SafetyAlert";

// Mock data for demonstration
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
  
  const isDark = mode === "night";
  
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
  
  // Filter and sort places
  const sortedPlaces = [...mockPlaces].sort((a, b) => {
    // Prioritize by status, then ETA
    const statusOrder = { not_busy: 0, moderate: 1, busy: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.eta_minutes - b.eta_minutes;
  });
  
  const selectedRoute = mockRoutes.find(r => r.id === selectedRouteId);
  
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
                {mockRoutes.map((route) => (
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
                routes={mockRoutes}
                userLocation={liveLocation}
                destination={mockDestination}
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