import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function FavoriteButton({ 
  type, // "location" or "route"
  data, // place data or route data
  isDark = false,
  className = ""
}) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if already favorited
  const { data: favorites = [] } = useQuery({
    queryKey: type === "location" ? ["favoriteLocations"] : ["favoriteRoutes"],
    queryFn: () => 
      type === "location" 
        ? base44.entities.FavoriteLocation.list()
        : base44.entities.FavoriteRoute.list(),
  });

  const isFavorited = type === "location"
    ? favorites.some(fav => fav.place_id === data.place_id || fav.place_id === data.id)
    : favorites.some(fav => 
        fav.origin_lat === data.origin_lat && 
        fav.origin_lng === data.origin_lng &&
        fav.dest_lat === data.dest_lat && 
        fav.dest_lng === data.dest_lng
      );

  // Add to favorites
  const addMutation = useMutation({
    mutationFn: (favoriteData) =>
      type === "location"
        ? base44.entities.FavoriteLocation.create(favoriteData)
        : base44.entities.FavoriteRoute.create(favoriteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: type === "location" ? ["favoriteLocations"] : ["favoriteRoutes"] 
      });
      toast.success(`Added to favorites!`);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    },
  });

  // Remove from favorites
  const removeMutation = useMutation({
    mutationFn: (id) =>
      type === "location"
        ? base44.entities.FavoriteLocation.delete(id)
        : base44.entities.FavoriteRoute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: type === "location" ? ["favoriteLocations"] : ["favoriteRoutes"] 
      });
      toast.success("Removed from favorites");
    },
  });

  const handleClick = (e) => {
    e.stopPropagation();

    if (isFavorited) {
      // Find and remove
      const favorite = favorites.find(fav => {
        if (type === "location") {
          return fav.place_id === data.place_id || fav.place_id === data.id;
        } else {
          return (
            fav.origin_lat === data.origin_lat && 
            fav.origin_lng === data.origin_lng &&
            fav.dest_lat === data.dest_lat && 
            fav.dest_lng === data.dest_lng
          );
        }
      });
      if (favorite) {
        removeMutation.mutate(favorite.id);
      }
    } else {
      // Add new favorite
      if (type === "location") {
        addMutation.mutate({
          place_id: data.place_id || data.id,
          name: data.name,
          type: data.type,
          address: data.vicinity || data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else {
        addMutation.mutate({
          route_name: data.route_name || `${data.origin_label} to ${data.dest_label}`,
          origin_lat: data.origin_lat,
          origin_lng: data.origin_lng,
          origin_label: data.origin_label,
          dest_lat: data.dest_lat,
          dest_lng: data.dest_lng,
          dest_label: data.dest_label,
          route_type: data.route_type,
          eta_minutes: data.eta,
          safety_score: data.safetyScore,
        });
      }
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        text-sm font-medium transition-colors
        ${isFavorited 
          ? isDark 
            ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" 
            : "bg-rose-500 text-white hover:bg-rose-600"
          : isDark
            ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }
        ${className}
      `}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.5, 1] } : {}}
        transition={{ duration: 0.6 }}
      >
        <Heart 
          className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} 
        />
      </motion.div>
      {isFavorited ? "Favorited" : "Favorite"}
    </motion.button>
  );
}