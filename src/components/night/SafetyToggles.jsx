import { Sun, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const toggles = [
  { id: "well_lit", icon: Sun, label: "Well-lit" },
  { id: "busy_areas", icon: Users, label: "Busy areas" },
  { id: "avoid_isolated", icon: AlertTriangle, label: "Avoid isolated" },
];

export default function SafetyToggles({ active, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      {toggles.map((toggle) => {
        const Icon = toggle.icon;
        const isActive = active.includes(toggle.id);
        
        return (
          <motion.button
            key={toggle.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(toggle.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl
              text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{toggle.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}