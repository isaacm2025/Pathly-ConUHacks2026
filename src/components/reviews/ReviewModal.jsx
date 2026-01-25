import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REVIEW_TAGS = {
  location: ["Clean", "Safe", "Quiet", "Crowded", "Well-lit", "Accessible"],
  route: ["Well-lit", "Safe", "Scenic", "Busy", "Direct", "Peaceful"],
};

export default function ReviewModal({ isOpen, onClose, reviewType, targetId, targetName, isDark = false }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = REVIEW_TAGS[reviewType] || [];

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Review.create({
        review_type: reviewType,
        target_id: targetId,
        target_name: targetName,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        helpful_count: 0,
      });

      // Reset form
      setRating(0);
      setComment("");
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`
            w-full max-w-lg rounded-2xl p-6
            ${isDark ? "bg-slate-800 text-white" : "bg-white text-slate-900"}
            shadow-2xl
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                Rate {reviewType === "location" ? "Location" : "Route"}
              </h2>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {targetName}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Your Rating
            </label>
            <StarRating rating={rating} onRate={setRating} size="lg" />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <Tag className="w-4 h-4" />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${selectedTags.includes(tag)
                      ? isDark
                        ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                      : isDark
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              <MessageSquare className="w-4 h-4" />
              Your Review (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className={`
                h-24 resize-none
                ${isDark 
                  ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
                  : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                }
              `}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className={`flex-1 ${isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : ""}`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`flex-1 ${
                isDark ? "bg-teal-500 hover:bg-teal-600" : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}