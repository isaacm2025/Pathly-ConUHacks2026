import { motion, AnimatePresence } from "framer-motion";
import { Sun, Users, AlertTriangle, Zap, Shield, X, Settings } from "lucide-react";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { useState } from "react";

export default function ComfortProfileSheet({ isOpen, onClose, isDark }) {
  const {
    preferences,
    togglePreference,
    updatePreference,
    setComfortProfile,
    COMFORT_PROFILES,
    resetPreferences,
  } = useUserPreferences();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggles = [
    { id: "preferWellLit", icon: Sun, label: "Prefer well-lit streets", description: "Routes with better street lighting" },
    { id: "preferBusyStreets", icon: Users, label: "Prefer busy streets", description: "Routes with more pedestrian activity" },
    { id: "avoidIsolated", icon: AlertTriangle, label: "Avoid isolated areas", description: "Skip quiet or secluded paths" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`
              fixed right-0 top-0 bottom-0 w-full max-w-md z-50
              flex flex-col overflow-hidden
              ${isDark ? "bg-slate-900" : "bg-white"}
            `}
          >
            {/* Header */}
            <div className={`
              flex items-center justify-between px-6 py-4 border-b
              ${isDark ? "border-slate-700" : "border-slate-200"}
            `}>
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Your Preferences
                </h2>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Personalize your navigation
                </p>
              </div>
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-xl transition-colors
                  ${isDark
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-slate-100 text-slate-500"
                  }
                `}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Comfort Profile Selection */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Comfort Profile
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(COMFORT_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setComfortProfile(key)}
                      className={`
                        p-4 rounded-2xl border text-center transition-all
                        ${preferences.comfortProfile === key
                          ? isDark
                            ? "bg-teal-500/20 border-teal-500/50 text-teal-400"
                            : "bg-teal-50 border-teal-200 text-teal-700"
                          : isDark
                            ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }
                      `}
                    >
                      <span className="text-2xl mb-2 block">{profile.icon}</span>
                      <span className="font-medium text-sm block">{profile.label}</span>
                    </button>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {COMFORT_PROFILES[preferences.comfortProfile]?.description}
                </p>
              </div>

              {/* Speed vs Safety Slider */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Route Priority
                </h3>
                <div className={`
                  p-4 rounded-2xl
                  ${isDark ? "bg-slate-800" : "bg-slate-50"}
                `}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Safer</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500">
                      <span className="text-sm font-medium">Faster</span>
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.speedVsSafety}
                    onChange={(e) => updatePreference("speedVsSafety", parseFloat(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Explicit Preference Toggles */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Route Preferences
                </h3>
                <div className="space-y-3">
                  {toggles.map((toggle) => {
                    const Icon = toggle.icon;
                    const isActive = preferences[toggle.id];

                    return (
                      <button
                        key={toggle.id}
                        onClick={() => togglePreference(toggle.id)}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all
                          ${isActive
                            ? isDark
                              ? "bg-teal-500/10 border-teal-500/30"
                              : "bg-teal-50 border-teal-200"
                            : isDark
                              ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }
                        `}
                      >
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          ${isActive
                            ? isDark ? "bg-teal-500/20 text-teal-400" : "bg-teal-100 text-teal-600"
                            : isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"
                          }
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium block ${isDark ? "text-white" : "text-slate-900"}`}>
                            {toggle.label}
                          </span>
                          <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {toggle.description}
                          </span>
                        </div>
                        <div className={`
                          w-12 h-7 rounded-full p-1 transition-colors
                          ${isActive
                            ? "bg-teal-500"
                            : isDark ? "bg-slate-600" : "bg-slate-300"
                          }
                        `}>
                          <motion.div
                            animate={{ x: isActive ? 20 : 0 }}
                            className="w-5 h-5 rounded-full bg-white shadow-sm"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Note */}
              <div className={`
                p-4 rounded-2xl border
                ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}
              `}>
                <div className="flex items-start gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isDark ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"}
                  `}>
                    🔒
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                      Privacy-First
                    </h4>
                    <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Your preferences are stored locally on your device. No identity profiling, no demographic inference.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`
              px-6 py-4 border-t
              ${isDark ? "border-slate-700" : "border-slate-200"}
            `}>
              <button
                onClick={resetPreferences}
                className={`
                  w-full py-3 rounded-xl font-medium transition-colors
                  ${isDark
                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }
                `}
              >
                Reset to Defaults
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
