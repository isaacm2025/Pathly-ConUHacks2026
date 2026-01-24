import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import StatusPill from "../shared/StatusPill";

export default function PlaceCard({ place, rank, isHighlighted, onHover }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`
        relative flex items-center gap-4 p-4 rounded-2xl
        bg-white border transition-all duration-300 cursor-pointer
        ${isHighlighted 
          ? "border-blue-200 shadow-lg shadow-blue-100/50 scale-[1.02]" 
          : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
        }
      `}
    >
      {/* Rank Number */}
      <div className={`
        flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
        text-xl font-bold transition-colors duration-300
        ${isHighlighted 
          ? "bg-blue-500 text-white" 
          : "bg-slate-100 text-slate-400"
        }
      `}>
        {rank}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-slate-900 truncate">
          {place.name}
        </h3>
        
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {place.eta_minutes} min
          </span>
          <StatusPill status={place.status} />
        </div>
      </div>
      
      {/* Updated indicator */}
      <div className="flex-shrink-0 text-xs text-slate-400">
        Just now
      </div>
    </motion.div>
  );
}