import { motion } from "framer-motion";
import { Shield, Zap, Scale, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ReviewButton from "../reviews/ReviewButton";
import ReviewModal from "../reviews/ReviewModal";
import ReviewsDrawer from "../reviews/ReviewsDrawer";

const routeConfig = {
  safest: {
    icon: Shield,
    color: "emerald",
    bgActive: "bg-emerald-500/20",
    borderActive: "border-emerald-500/50",
    textActive: "text-emerald-400"
  },
  balanced: {
    icon: Scale,
    color: "blue",
    bgActive: "bg-blue-500/20",
    borderActive: "border-blue-500/50",
    textActive: "text-blue-400"
  },
  fastest: {
    icon: Zap,
    color: "amber",
    bgActive: "bg-amber-500/20",
    borderActive: "border-amber-500/50",
    textActive: "text-amber-400"
  }
};

export default function RouteCard({ route, isSelected, onSelect }) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsDrawer, setShowReviewsDrawer] = useState(false);

  // Fetch review count for this route
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "route", route.id],
    queryFn: async () => {
      return await base44.entities.Review.filter({ review_type: "route", target_id: route.id });
    },
  });

  const config = routeConfig[route.type] || routeConfig.balanced;
  const Icon = config.icon;
  
  return (
    <>
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(route.id)}
      className={`
        w-full p-5 rounded-2xl border text-left
        transition-all duration-300
        ${isSelected 
          ? `${config.bgActive} ${config.borderActive}` 
          : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isSelected ? config.bgActive : "bg-slate-700"}
          `}>
            <Icon className={`w-5 h-5 ${isSelected ? config.textActive : "text-slate-400"}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold capitalize ${isSelected ? "text-white" : "text-slate-200"}`}>
              {route.type}
            </h3>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {route.eta} min
            </div>
          </div>
        </div>
        
        {/* Safety Score */}
        <div className={`
          text-3xl font-bold tracking-tight
          ${isSelected ? config.textActive : "text-slate-500"}
        `}>
          {route.safetyScore}
        </div>
      </div>
      
      <p className={`text-sm ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
        {route.description}
      </p>
      
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mt-4 text-sm font-medium text-emerald-400"
        >
          Start navigation
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      )}

      {/* Review Button - only show when selected */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-slate-700"
        >
          <ReviewButton
            onClick={(e) => {
              e.stopPropagation();
              setShowReviewsDrawer(true);
            }}
            isDark={true}
            count={reviews.length}
          />
        </motion.div>
      )}
    </motion.button>

    {/* Review Modal */}
    <ReviewModal
      isOpen={showReviewModal}
      onClose={() => setShowReviewModal(false)}
      reviewType="route"
      targetId={route.id}
      targetName={`${route.type} route`}
      isDark={true}
    />

    {/* Reviews Drawer */}
    <ReviewsDrawer
      isOpen={showReviewsDrawer}
      onClose={() => setShowReviewsDrawer(false)}
      reviewType="route"
      targetId={route.id}
      targetName={`${route.type} route`}
      onOpenReviewModal={() => {
        setShowReviewsDrawer(false);
        setShowReviewModal(true);
      }}
      isDark={true}
    />
    </>
  );
}