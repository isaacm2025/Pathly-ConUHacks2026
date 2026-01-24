import { AnimatePresence } from "framer-motion";
import PlaceCard from "./PlaceCard";

export default function PlacesList({ places, highlightedId, onHover, onPlaceSelect, selectedPlaceId }) {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {places.map((place, index) => (
          <PlaceCard
            key={place.id}
            place={place}
            rank={index + 1}
            isHighlighted={highlightedId === place.id}
            isSelected={selectedPlaceId === place.id}
            onHover={onHover}
            onSelect={onPlaceSelect}
          />
        ))}
      </AnimatePresence>

      {places.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          No places found matching your filters
        </div>
      )}
    </div>
  );
}