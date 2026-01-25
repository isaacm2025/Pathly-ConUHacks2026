import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

export default function AudioButton({ onClick, isLoading, isPlaying }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={isLoading}
      className="relative p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPlaying ? "Stop audio" : "Play audio"}
    >
      {isPlaying ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Volume2 size={20} className="text-white" />
        </motion.div>
      ) : (
        <VolumeX size={20} className="text-white/70" />
      )}
      
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.button>
  );
}
