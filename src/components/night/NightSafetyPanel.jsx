import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Phone, 
  Share2, 
  Flashlight, 
  AlertTriangle, 
  MapPin, 
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Lightbulb,
  Eye
} from "lucide-react";

// Safety tips based on time and context
const SAFETY_TIPS = [
  { icon: Eye, text: "Stay aware of your surroundings at all times" },
  { icon: Lightbulb, text: "Stick to well-lit main streets when possible" },
  { icon: Users, text: "Walk in groups or populated areas" },
  { icon: Phone, text: "Keep your phone charged and accessible" },
  { icon: MapPin, text: "Share your live location with a trusted contact" },
];

export default function NightSafetyPanel({ userLocation, destination, isDark = true }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [locationShared, setLocationShared] = useState(false);

  const hour = new Date().getHours();
  const isLateNight = hour >= 23 || hour < 5;

  // Calculate a mock safety score for the area (would use real data in production)
  const areaSafetyScore = destination ? 78 : 85;
  const safetyLevel = areaSafetyScore >= 80 ? "good" : areaSafetyScore >= 60 ? "moderate" : "caution";

  const handleShareLocation = async () => {
    if (navigator.share && userLocation) {
      try {
        await navigator.share({
          title: "My Current Location",
          text: `I'm at: https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}`,
          url: `https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}`
        });
        setLocationShared(true);
        setTimeout(() => setLocationShared(false), 3000);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const url = `https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}`;
      navigator.clipboard.writeText(url);
      setLocationShared(true);
      setTimeout(() => setLocationShared(false), 3000);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = "tel:911";
  };

  const toggleFlashlight = async () => {
    // Note: Flashlight API requires HTTPS and user permission
    // This is a visual toggle; actual flashlight would need native app
    setFlashlightOn(!flashlightOn);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/80 backdrop-blur-sm"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            safetyLevel === "good" ? "bg-emerald-500/20" :
            safetyLevel === "moderate" ? "bg-amber-500/20" : "bg-rose-500/20"
          }`}>
            <Shield className={`w-4 h-4 ${
              safetyLevel === "good" ? "text-emerald-400" :
              safetyLevel === "moderate" ? "text-amber-400" : "text-rose-400"
            }`} />
          </div>
          <span className="font-semibold text-sm text-white">Safety Tools</span>
          {isLateNight && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
              Late Night
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
            safetyLevel === "good" ? "bg-emerald-500/20 text-emerald-400" :
            safetyLevel === "moderate" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
          }`}>
            Area: {areaSafetyScore}%
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
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
            <div className="px-4 pb-4 space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                {/* Emergency Call */}
                <button
                  onClick={handleEmergencyCall}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/30"
                >
                  <Phone className="w-5 h-5 text-rose-400" />
                  <span className="text-xs text-rose-300 font-medium">Emergency</span>
                </button>

                {/* Share Location */}
                <button
                  onClick={handleShareLocation}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors border ${
                    locationShared 
                      ? "bg-emerald-500/20 border-emerald-500/30" 
                      : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30"
                  }`}
                >
                  <Share2 className={`w-5 h-5 ${locationShared ? "text-emerald-400" : "text-blue-400"}`} />
                  <span className={`text-xs font-medium ${locationShared ? "text-emerald-300" : "text-blue-300"}`}>
                    {locationShared ? "Shared!" : "Share Location"}
                  </span>
                </button>

                {/* Flashlight Toggle */}
                <button
                  onClick={toggleFlashlight}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors border ${
                    flashlightOn 
                      ? "bg-yellow-500/20 border-yellow-500/30" 
                      : "bg-slate-700/50 hover:bg-slate-700 border-slate-600"
                  }`}
                >
                  <Flashlight className={`w-5 h-5 ${flashlightOn ? "text-yellow-400" : "text-slate-400"}`} />
                  <span className={`text-xs font-medium ${flashlightOn ? "text-yellow-300" : "text-slate-400"}`}>
                    {flashlightOn ? "Light On" : "Flashlight"}
                  </span>
                </button>
              </div>

              {/* Safety Tips */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Safety Tips</h4>
                <div className="space-y-1.5">
                  {SAFETY_TIPS.slice(0, 3).map((tip, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/30">
                      <tip.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="text-xs text-slate-400">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {userLocation ? "Location active" : "No location"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
