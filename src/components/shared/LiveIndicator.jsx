import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LiveIndicator({ lastUpdate, isDark = false }) {
  const [timeAgo, setTimeAgo] = useState("just now");
  
  useEffect(() => {
    const updateTime = () => {
      if (!lastUpdate) {
        setTimeAgo("just now");
        return;
      }
      const seconds = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);
      if (seconds < 10) setTimeAgo("just now");
      else if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, [lastUpdate]);
  
  return (
    <div className={`flex items-center gap-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-2 h-2 rounded-full bg-emerald-500"
      />
      <span className="font-medium">Live</span>
      <span className={isDark ? "text-slate-500" : "text-slate-400"}>·</span>
      <span>Updated {timeAgo}</span>
    </div>
  );
}