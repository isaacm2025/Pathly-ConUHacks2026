import { Sun, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const toggles = [
  { id: "well_lit", icon: Sun, label: "Well-lit" },
  { id: "busy_areas", icon: Users, label: "Busy areas" },
  { id: "avoid_isolated", icon: AlertTriangle, label: "Avoid isolated" },
];

export default function SafetyToggles({ active, onToggle }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {toggles.map((toggle) => {
        const Icon = toggle.icon;
        const isActive = active.includes(toggle.id);
        
        return (
          <motion.button
            key={toggle.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(toggle.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full
              text-sm font-medium whitespace-nowrap transition-all duration-200
              ${isActive
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-slate-800/60 text-teal-300/80 border border-slate-700/70 hover:bg-slate-700"
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {toggle.label}
          </motion.button>
        );
      })}
    </div>
  );
}
