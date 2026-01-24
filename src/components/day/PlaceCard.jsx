
import { motion } from "framer-motion";
import { Clock, Star, MapPin, TrendingUp } from "lucide-react";
import StatusPill from "../shared/StatusPill";

export default function PlaceCard({ place, rank, isHighlighted, isSelected, onHover, onSelect }) {
  const handleClick = () => {
    // Notify parent to show route on map - no modal, just show the path
    onSelect?.(place);
  };

  // Get recommendation score color
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    return "text-amber-600 bg-amber-50";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={handleClick}
      className={
          `relative flex items-center gap-4 p-4 rounded-2xl
          bg-white border transition-all duration-300 cursor-pointer
          ${isSelected
            ? "border-emerald-400 shadow-lg shadow-emerald-100/50 scale-[1.02] ring-2 ring-emerald-200"
            : isHighlighted
              ? "border-blue-200 shadow-lg shadow-blue-100/50 scale-[1.02]"
              : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
          }`
        }
      >
        {/* Rank Number */}
        <div className={
          `flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
          text-xl font-bold transition-colors duration-300
          ${isHighlighted
            ? "bg-blue-500 text-white"
            : "bg-slate-100 text-slate-400"
          }`
        }>
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {place.name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {place.eta_minutes} min
            </span>
            {place.rating && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {place.rating.toFixed(1)}
              </span>
            )}
            <StatusPill status={place.status} />
          </div>
          {place.vicinity && (
            <p className="text-xs text-slate-400 mt-1 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {place.vicinity}
            </p>
          )}
        </div>

        {/* Score Badge */}
        {place.score && (
          <div className={`
            flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold
            ${getScoreColor(place.score)}
          `}>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {place.score}
            </div>
          </div>
        )}
      </motion.div>
  );
}