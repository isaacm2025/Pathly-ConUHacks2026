import { MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";

export default function DestinationBar({ destination, eta, routeType }) {
  if (!destination) return null;
  
  const routeLabels = {
    safest: "Safest Route",
    balanced: "Balanced",
    fastest: "Fastest"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-4 px-5 py-3 rounded-2xl
        bg-slate-900/95 backdrop-blur-xl border border-slate-700
        shadow-xl shadow-black/30
      "
    >
      <div className="flex items-center gap-2 text-violet-400">
        <MapPin className="w-4 h-4" />
        <span className="font-semibold">{destination.label}</span>
      </div>
      
      <div className="w-px h-5 bg-slate-700" />
      
      <span className="text-slate-300">
        {eta} min
      </span>
      
      <div className="w-px h-5 bg-slate-700" />
      
      <span className="text-emerald-400 text-sm font-medium">
        {routeLabels[routeType] || "Route"}
      </span>
      
      <button className="
        ml-2 p-2 rounded-xl bg-teal-500 text-white
        hover:bg-teal-400 transition-colors
      ">
        <Navigation className="w-4 h-4" />
      </button>
    </motion.div>
  );
}