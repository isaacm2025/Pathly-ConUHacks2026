import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function StarRating({ rating, onRate = null, size = "md", readonly = false }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        const isHalf = star === Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <motion.button
            key={star}
            type="button"
            whileHover={!readonly && onRate ? { scale: 1.1 } : {}}
            whileTap={!readonly && onRate ? { scale: 0.95 } : {}}
            onClick={() => !readonly && onRate && onRate(star)}
            disabled={readonly || !onRate}
            className={`transition-colors ${!readonly && onRate ? "cursor-pointer" : "cursor-default"}`}
          >
            <Star
              className={`${sizeClass} ${
                isFilled ? "fill-amber-400 text-amber-400" : 
                isHalf ? "fill-amber-400/50 text-amber-400" : 
                "text-slate-300"
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}