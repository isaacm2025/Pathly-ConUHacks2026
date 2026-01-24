import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

export default function SafetyAlert({ message, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="
            fixed top-20 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-3 px-4 py-2.5 rounded-xl
            bg-amber-500/10 border border-amber-500/20
            text-amber-400 text-sm
          "
        >
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}