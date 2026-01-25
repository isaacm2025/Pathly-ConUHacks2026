import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, User, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StarRating from "./StarRating";
import moment from "moment";

export default function ReviewsList({ reviewType, targetId, isDark = false }) {
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", reviewType, targetId],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.filter(
        { review_type: reviewType, target_id: targetId },
        "-created_date"
      );
      return allReviews;
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId) => {
      const review = reviews.find((r) => r.id === reviewId);
      await base44.entities.Review.update(reviewId, {
        helpful_count: (review?.helpful_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", reviewType, targetId] });
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        <p>No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`p-4 rounded-xl ${isDark ? "bg-slate-700/50" : "bg-slate-50"}`}>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <StarRating rating={averageRating} readonly size="sm" />
          </div>
          <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              p-4 rounded-xl border
              ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? "bg-slate-700" : "bg-slate-100"
                }`}>
                  <User className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                </div>
                <div>
                  <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                    {review.created_by?.split("@")[0] || "Anonymous"}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <Clock className="w-3 h-3" />
                    {moment(review.created_date).fromNow()}
                  </div>
                </div>
              </div>
              <StarRating rating={review.rating} readonly size="sm" />
            </div>

            {/* Tags */}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`
                      px-2 py-0.5 rounded-full text-xs
                      ${isDark 
                        ? "bg-teal-500/10 text-teal-400" 
                        : "bg-blue-50 text-blue-600"
                      }
                    `}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comment */}
            {review.comment && (
              <p className={`text-sm mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {review.comment}
              </p>
            )}

            {/* Helpful Button */}
            <button
              onClick={() => helpfulMutation.mutate(review.id)}
              disabled={helpfulMutation.isPending}
              className={`
                flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg
                transition-colors
                ${isDark
                  ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }
              `}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Helpful ({review.helpful_count || 0})
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}