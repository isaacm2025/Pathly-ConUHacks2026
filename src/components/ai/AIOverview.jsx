import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, MapPin, Clock, Users } from "lucide-react";

// Smart local AI that analyzes places and generates insights
function generateLocalInsights(places, timeContext) {
  if (!places || places.length === 0) {
    return {
      headline: "Discovering nearby spots...",
      summary: "We're finding the best places for you.",
      highlights: []
    };
  }

  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 6;
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  // Analyze the places
  const notBusyPlaces = places.filter(p => p.status === "not_busy");
  const closestPlace = [...places].sort((a, b) => (a.eta_minutes || 99) - (b.eta_minutes || 99))[0];
  const highestRated = [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const cafes = places.filter(p => p.type === "cafe");
  const restaurants = places.filter(p => p.type === "restaurant" || p.type === "bar");
  
  // Generate time-aware headline
  let headline = "";
  let summary = "";
  const highlights = [];

  if (isMorning) {
    headline = "Good morning! ☀️";
    if (cafes.length > 0) {
      const quietCafe = cafes.find(c => c.status === "not_busy") || cafes[0];
      summary = `Perfect time for coffee. ${quietCafe.name} is ${quietCafe.status === "not_busy" ? "quiet right now" : "a great option"}.`;
    } else {
      summary = `${places.length} spots nearby to start your day.`;
    }
  } else if (isAfternoon) {
    headline = "Afternoon vibes 🌤️";
    if (notBusyPlaces.length > 0) {
      summary = `${notBusyPlaces.length} quiet spots available. ${notBusyPlaces[0].name} has low crowds.`;
    } else {
      summary = `Most places are busy, but ${closestPlace.name} is just ${closestPlace.eta_minutes} min away.`;
    }
  } else if (isEvening) {
    headline = "Evening out? 🌙";
    if (restaurants.length > 0) {
      summary = `${restaurants.length} dining options nearby. ${highestRated.name} is top-rated at ${highestRated.rating}★.`;
    } else {
      summary = `${places.length} places to check out tonight.`;
    }
  }

  // Generate highlights
  if (closestPlace) {
    highlights.push({
      icon: "clock",
      label: "Closest",
      value: `${closestPlace.name} (${closestPlace.eta_minutes} min)`
    });
  }

  if (notBusyPlaces.length > 0) {
    highlights.push({
      icon: "users",
      label: "Least busy",
      value: notBusyPlaces[0].name
    });
  }

  if (highestRated && highestRated.rating) {
    highlights.push({
      icon: "pin",
      label: "Top rated",
      value: `${highestRated.name} (${highestRated.rating}★)`
    });
  }

  return { headline, summary, highlights };
}

export default function AIOverview({ places = [], timeContext, isDark = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const insights = useMemo(() => 
    generateLocalInsights(places, timeContext), 
    [places, timeContext]
  );

  const IconComponent = ({ name }) => {
    switch (name) {
      case "clock": return <Clock className="w-3.5 h-3.5" />;
      case "users": return <Users className="w-3.5 h-3.5" />;
      case "pin": return <MapPin className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 rounded-2xl overflow-hidden shadow-sm border
        ${isDark 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-slate-200'}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between
          ${isDark ? 'hover:bg-slate-700/30' : 'hover:bg-white/50'} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg 
            ${isDark 
              ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
              : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
            AI Overview
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Headline & Summary */}
              <div className="mb-3">
                <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {insights.headline}
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {insights.summary}
                </p>
              </div>

              {/* Highlights */}
              {insights.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insights.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                        ${isDark 
                          ? 'bg-slate-700/50 text-slate-300' 
                          : 'bg-white/70 text-slate-600 shadow-sm'}`}
                    >
                      <IconComponent name={highlight.icon} />
                      <span className="font-medium">{highlight.label}:</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        {highlight.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
