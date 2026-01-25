import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import ReviewsList from "./ReviewsList";
import ReviewButton from "./ReviewButton";

export default function ReviewsDrawer({ isOpen, onClose, reviewType, targetId, targetName, onOpenReviewModal, isDark = false }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={`
            fixed right-0 top-0 bottom-0 w-full max-w-md
            ${isDark ? "bg-slate-900" : "bg-white"}
            shadow-2xl overflow-y-auto
          `}
        >
          {/* Header */}
          <div className={`sticky top-0 ${isDark ? "bg-slate-900" : "bg-white"} border-b ${isDark ? "border-slate-700" : "border-slate-200"} p-4 z-10`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Reviews
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {targetName}
            </p>
            
            {/* Add Review Button */}
            <button
              onClick={onOpenReviewModal}
              className={`
                w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                font-medium text-sm transition-colors
                ${isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
                }
              `}
            >
              <Plus className="w-4 h-4" />
              Add Your Review
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <ReviewsList
              reviewType={reviewType}
              targetId={targetId}
              isDark={isDark}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}