import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, Shield } from "lucide-react";

const alertTypes = {
  info: {
    icon: Info,
    bgClass: "bg-blue-500/10 border-blue-500/20",
    textClass: "text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-400",
  },
  safe: {
    icon: Shield,
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-400",
  },
};

export default function SafetyAlert({ message, isVisible, type = "warning" }) {
  const config = alertTypes[type] || alertTypes.warning;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`
            fixed top-20 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-3 px-5 py-3 rounded-2xl
            ${config.bgClass} border backdrop-blur-lg
            ${config.textClass} text-sm font-medium
            shadow-lg shadow-black/20
          `}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}