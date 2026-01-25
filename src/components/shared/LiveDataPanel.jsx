import React from "react";
import { motion } from "framer-motion";

// Severity badge colors
const severityColors = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

// Translate French incident types to English
const translateIncidentType = (type) => {
  const translations = {
    "Vol dans / sur véhicule à moteur": "Vehicle Theft",
    "Introduction": "Break-in",
    "Méfait": "Mischief/Vandalism",
    "Vol qualifié": "Robbery",
    "Voies de fait": "Assault",
    "Vol de véhicule à moteur": "Car Theft",
  };
  return translations[type] || type;
};

export default function LiveDataPanel({ liveData, isDark = false }) {
  const { incidents, weather, constructions, lighting, safetyScore, isLoading, lastUpdated, sources } = liveData;

  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Loading live safety data...
          </span>
        </div>
      </div>
    );
  }

  const incidentCount = incidents?.length || 0;
  const constructionCount = constructions?.length || 0;
  const lightingScore = lighting?.coverageScore || 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border`}
    >
      {/* Header with Live indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Live Safety Data
          </span>
        </div>
        {safetyScore !== null && (
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            safetyScore >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
            safetyScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            Safety: {safetyScore}%
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <div className={`text-2xl font-bold ${incidentCount > 5 ? 'text-red-400' : incidentCount > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {incidentCount}
          </div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Incidents (7d)</div>
        </div>
        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <div className={`text-2xl font-bold ${constructionCount > 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
            {constructionCount}
          </div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Construction</div>
        </div>
        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
          <div className={`text-2xl font-bold ${lightingScore >= 70 ? 'text-emerald-400' : lightingScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {lightingScore}%
          </div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lighting</div>
        </div>
      </div>

      {/* Weather (if available) */}
      {weather && weather.conditions !== 'unknown' && (
        <div className={`p-2 rounded-lg mb-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {weather.conditions === 'Clear' ? '☀️' :
               weather.conditions === 'Clouds' ? '☁️' :
               weather.conditions === 'Rain' ? '🌧️' :
               weather.conditions === 'Snow' ? '❄️' : '🌤️'}
            </span>
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {weather.temperature !== null ? `${Math.round(weather.temperature)}°C` : ''} {weather.description || weather.conditions}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${
            weather.walkingSafety === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
            weather.walkingSafety === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {weather.walkingSafety === 'good' ? 'Good for walking' :
             weather.walkingSafety === 'moderate' ? 'Use caution' : 'Poor conditions'}
          </span>
        </div>
      )}

      {/* Recent Incidents List */}
      {incidents && incidents.length > 0 && (
        <div className="space-y-2">
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Recent Incidents Nearby:
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {incidents.slice(0, 4).map((incident, index) => (
              <div 
                key={incident.id || index}
                className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${severityColors[incident.severity] || severityColors.low}`}>
                    {incident.severity?.toUpperCase() || 'LOW'}
                  </span>
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {translateIncidentType(incident.type)}
                  </span>
                </div>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {incident.timeAgo || incident.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className={`mt-3 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Sources: Montreal Open Data, OpenStreetMap
          {lastUpdated && ` • Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
        </div>
      </div>
    </motion.div>
  );
}
