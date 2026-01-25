import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ModeToggle({ mode, onToggle }) {
  const isDay = mode === "day";

  return (
    <div className="relative flex items-center p-1 rounded-full bg-slate-700">
      <motion.div
        initial={false}
        animate={{ x: isDay ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm"
      />

      <button
        onClick={() => isDay ? null : onToggle()}
        className={`
          relative z-10 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full
          text-sm font-medium transition-colors min-w-[90px]
          ${isDay ? "text-slate-700" : "text-slate-300"}
        `}
      >
        <Sun className="w-4 h-4" />
        Day
      </button>

      <button
        onClick={() => !isDay ? null : onToggle()}
        className={`
          relative z-10 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full
          text-sm font-medium transition-colors min-w-[90px]
          ${!isDay ? "text-slate-700" : "text-slate-300"}
        `}
      >
        <Moon className="w-4 h-4" />
        Night
      </button>
    </div>
  );
}