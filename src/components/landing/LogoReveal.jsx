import { motion } from "framer-motion";
import { Navigation } from "lucide-react";

export default function LogoReveal({ isVisible, isDisintegrating }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isDisintegrating ? 0 : (isVisible ? 1 : 0),
        scale: isDisintegrating ? 1.2 : (isVisible ? 1 : 0.8),
        filter: isDisintegrating ? "blur(20px)" : "blur(0px)",
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="absolute inset-0 flex flex-col items-center justify-center"
    >
      {/* Logo Icon */}
      <motion.div
        animate={{
          opacity: isDisintegrating ? [1, 0] : [0, 1],
          y: isDisintegrating ? -50 : 0,
        }}
        transition={{ duration: isDisintegrating ? 0.8 : 1.2, delay: isDisintegrating ? 0 : 2.5 }}
        className="mb-6"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <Navigation className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          
          {/* Glow effect */}
          <motion.div
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-400 to-teal-400 blur-xl -z-10"
          />
        </motion.div>
      </motion.div>
      
      {/* Brand Name */}
      <motion.h1
        animate={{
          opacity: isDisintegrating ? [1, 0] : [0, 1],
          y: isDisintegrating ? 50 : 0,
        }}
        transition={{ duration: isDisintegrating ? 0.8 : 1, delay: isDisintegrating ? 0 : 3 }}
        className="text-7xl font-bold tracking-wider text-white mb-2"
        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em" }}
      >
        pathly
      </motion.h1>
      
      {/* Subtle breathing glow on text */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 blur-3xl rounded-full pointer-events-none"
      />
    </motion.div>
  );
}