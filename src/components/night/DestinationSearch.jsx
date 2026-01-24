import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DestinationSearch({
  onDestinationSelect,
  isDark = true,
  placeholder = "Where to?",
  currentDestination = null,
}) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // Create a dummy div for PlacesService (required but not displayed)
      const dummyDiv = document.createElement("div");
      placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  // Fetch predictions when query changes
  useEffect(() => {
    if (!query || query.length < 2 || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    const request = {
      input: query,
      sessionToken: sessionToken.current,
      componentRestrictions: { country: "ca" }, // Restrict to Canada
      location: new window.google.maps.LatLng(45.5019, -73.5674), // Montreal center
      radius: 50000, // 50km radius
    };

    autocompleteService.current.getPlacePredictions(request, (results, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results.slice(0, 5));
      } else {
        setPredictions([]);
      }
    });
  }, [query]);

  const handleSelect = (prediction) => {
    if (!placesService.current) return;

    setIsLoading(true);

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["name", "geometry", "formatted_address"],
        sessionToken: sessionToken.current,
      },
      (place, status) => {
        setIsLoading(false);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const destination = {
            label: place.name,
            address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            placeId: prediction.place_id,
          };

          onDestinationSelect(destination);
          setQuery(place.name);
          setIsOpen(false);
          setPredictions([]);

          // Reset session token for next search
          sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    onDestinationSelect(null);
    inputRef.current?.focus();
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const destination = {
            label: "Current Location",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          onDestinationSelect(destination);
          setQuery("Current Location");
          setIsOpen(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  // Quick destinations (favorites)
  const quickDestinations = [
    { label: "Home", icon: "🏠" },
    { label: "Work", icon: "💼" },
    { label: "Gym", icon: "🏋️" },
  ];

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className={`
        relative flex items-center gap-3 px-4 py-3 rounded-2xl
        transition-all duration-200
        ${isDark
          ? "bg-slate-800 border border-slate-700 focus-within:border-teal-500/50"
          : "bg-white border border-slate-200 focus-within:border-blue-500/50"
        }
        ${isOpen ? "shadow-lg" : ""}
      `}>
        <Search className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-400"}`} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`
            flex-1 bg-transparent outline-none text-base
            ${isDark ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}
          `}
        />

        {query && (
          <button onClick={handleClear} className={`p-1 rounded-full ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
          </button>
        )}

        {isLoading && (
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              absolute z-50 w-full mt-2 rounded-2xl overflow-hidden shadow-xl
              ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}
            `}
          >
            {/* Quick Actions */}
            {!query && (
              <div className="p-3 space-y-2">
                {/* Use Current Location */}
                <button
                  onClick={handleUseCurrentLocation}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-colors
                    ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-50"}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${isDark ? "bg-teal-500/20 text-teal-400" : "bg-blue-100 text-blue-600"}
                  `}>
                    <Navigation className="w-5 h-5" />
                  </div>
                  <span className={isDark ? "text-white" : "text-slate-900"}>
                    Use current location
                  </span>
                </button>

                {/* Quick Destinations */}
                <div className={`px-3 py-2 text-xs font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Quick Access
                </div>
                <div className="flex gap-2 px-3">
                  {quickDestinations.map((dest) => (
                    <button
                      key={dest.label}
                      onClick={() => {
                        setQuery(dest.label);
                        // In a real app, these would have saved coordinates
                      }}
                      className={`
                        flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-colors
                        ${isDark ? "bg-slate-700/50 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"}
                      `}
                    >
                      <span className="text-xl">{dest.icon}</span>
                      <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {dest.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Predictions */}
            {predictions.length > 0 && (
              <div className="py-2">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelect(prediction)}
                    className={`
                      w-full flex items-start gap-3 px-4 py-3 transition-colors
                      ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-50"}
                    `}
                  >
                    <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                    <div className="text-left">
                      <div className={isDark ? "text-white" : "text-slate-900"}>
                        {prediction.structured_formatting?.main_text || prediction.description}
                      </div>
                      <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {prediction.structured_formatting?.secondary_text}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && predictions.length === 0 && !isLoading && (
              <div className={`p-4 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No places found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
