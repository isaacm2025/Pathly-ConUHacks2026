import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ModeToggle({ mode, onToggle }) {
  const isDay = mode === "day";
  
  return (
    <button
      onClick={onToggle}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full
        transition-all duration-500 ease-out
        ${isDay 
          ? "bg-slate-100 text-slate-700" 
          : "bg-slate-700 text-slate-200"
        }
      `}
    >
      <motion.div
        initial={false}
        animate={{
          x: isDay ? 0 : 40,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          absolute left-0.5 top-0.5 bottom-0.5 w-10 rounded-full
          ${isDay ? "bg-white shadow-sm" : "bg-slate-600"}
        `}
      />
      
      <span className={`relative z-10 flex items-center gap-1.5 text-sm font-medium ${isDay ? "opacity-100" : "opacity-50"}`}>
        <Sun className="w-4 h-4" />
        Day
      </span>
      
      <span className={`relative z-10 flex items-center gap-1.5 text-sm font-medium ${!isDay ? "opacity-100" : "opacity-50"}`}>
        <Moon className="w-4 h-4" />
        Night
      </span>
    </button>
  );
}