import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const STREET_VIEW_BASE_URL = "https://maps.googleapis.com/maps/api/streetview";

// Generate Street View image URL
function getStreetViewUrl(lat, lng, apiKey, options = {}) {
  const {
    width = 400,
    height = 250,
    heading = 0,
    pitch = 0,
    fov = 90,
  } = options;

  return `${STREET_VIEW_BASE_URL}?size=${width}x${height}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
}

// Check if Street View is available at location
async function checkStreetViewAvailability(lat, lng, apiKey) {
  const metadataUrl = `${STREET_VIEW_BASE_URL}/metadata?location=${lat},${lng}&key=${apiKey}`;
  try {
    const response = await fetch(metadataUrl);
    const data = await response.json();
    return data.status === "OK";
  } catch {
    return false;
  }
}

export default function StreetViewPreview({ 
  location, // { lat, lng, label }
  routePoints = [], // Array of { lat, lng, label } for route preview
  isDark = false,
  onClose 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Combine single location with route points
  const allPoints = location 
    ? [location, ...routePoints]
    : routePoints;

  const currentPoint = allPoints[currentIndex];

  if (!apiKey || allPoints.length === 0) {
    return null;
  }

  const imageUrl = getStreetViewUrl(
    currentPoint.lat,
    currentPoint.lng,
    apiKey,
    { width: 600, height: 400 }
  );

  const handlePrev = () => {
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allPoints.length - 1));
  };

  const handleNext = () => {
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex((prev) => (prev < allPoints.length - 1 ? prev + 1 : 0));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl overflow-hidden border shadow-xl ${
        isDark 
          ? "bg-slate-900 border-slate-700" 
          : "bg-white border-slate-200"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${
        isDark ? "border-slate-700" : "border-slate-100"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isDark ? "bg-blue-500/20" : "bg-blue-100"
          }`}>
            <Eye className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
              Street View Preview
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {currentPoint?.label || "Location preview"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-video bg-slate-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <MapPin className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Street View not available here</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Street view of ${currentPoint?.label || "location"}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}

        {/* Navigation Arrows */}
        {allPoints.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Point Indicator */}
        {allPoints.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allPoints.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsLoading(true);
                  setHasError(false);
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex 
                    ? "bg-white" 
                    : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 flex items-center justify-between ${
        isDark ? "bg-slate-800/50" : "bg-slate-50"
      }`}>
        <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {allPoints.length > 1 
            ? `${currentIndex + 1} of ${allPoints.length} viewpoints`
            : "Destination preview"
          }
        </span>
        <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          📍 Google Street View
        </span>
      </div>
    </motion.div>
  );
}

// Compact button to trigger Street View preview
export function StreetViewButton({ onClick, isDark = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        isDark
          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          : "bg-blue-100 text-blue-600 hover:bg-blue-200"
      }`}
    >
      <Eye className="w-3.5 h-3.5" />
      Preview
    </button>
  );
}
