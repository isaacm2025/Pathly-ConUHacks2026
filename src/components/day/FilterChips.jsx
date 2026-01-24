import { Clock, DoorOpen, Users, Coffee, Dumbbell, BookOpen, Briefcase, Utensils } from "lucide-react";
import { motion } from "framer-motion";

const filters = [
  { id: "distance", label: "≤ 10 min", icon: Clock, category: "time" },
  { id: "open", label: "Open now", icon: DoorOpen, category: "status" },
  { id: "low_crowd", label: "Low crowd", icon: Users, category: "status" },
  { id: "cafe", label: "Cafe", icon: Coffee, category: "type" },
  { id: "gym", label: "Gym", icon: Dumbbell, category: "type" },
  { id: "library", label: "Library", icon: BookOpen, category: "type" },
  { id: "cowork", label: "Cowork", icon: Briefcase, category: "type" },
  { id: "restaurant", label: "Restaurant", icon: Utensils, category: "type" },
];

export default function FilterChips({ activeFilters, onToggle }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilters.includes(filter.id);

        // Type filters get a different color when active
        const isTypeFilter = filter.category === "type";

        return (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onToggle(filter.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-200
              ${isActive
                ? isTypeFilter
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}