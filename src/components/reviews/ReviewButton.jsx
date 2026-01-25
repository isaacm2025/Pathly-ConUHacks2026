import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewButton({ onClick, isDark = false, count = 0 }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-colors
        ${isDark
          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }
      `}
    >
      <Star className="w-3.5 h-3.5" />
      {count > 0 ? `${count} Reviews` : "Add Review"}
    </motion.button>
  );
}