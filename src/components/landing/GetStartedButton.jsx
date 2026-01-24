import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function GetStartedButton({ isVisible, onClick, isDisintegrating }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isDisintegrating ? 0 : (isVisible ? 1 : 0),
        y: isDisintegrating ? 100 : (isVisible ? 0 : 20),
        scale: isDisintegrating ? 0.8 : 1,
      }}
      transition={{ duration: isDisintegrating ? 0.8 : 0.8, delay: isDisintegrating ? 0 : 3.5 }}
      className="absolute bottom-32 inset-x-0 flex justify-center"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative px-8 py-4 rounded-2xl font-semibold text-lg text-white overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>

        {/* Animated gradient border */}
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 p-[2px] z-0">
          <span className="block h-full w-full rounded-2xl bg-slate-900" />
        </span>
        
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>
    </motion.div>
  );
}
