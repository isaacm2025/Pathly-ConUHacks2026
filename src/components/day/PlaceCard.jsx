
import { useState } from "react";
import { fetchPlaceDetails } from "../../api/pathlyApi";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import StatusPill from "../shared/StatusPill";

export default function PlaceCard({ place, rank, isHighlighted, onHover }) {
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setShowModal(true);
    setLoading(true);
    setError(null);
    try {
      // place.place_id must exist for Google Places API
      if (place.place_id) {
        const data = await fetchPlaceDetails(place.place_id);
        setDetails(data);
      } else {
        setError("No Google Place ID available for this place.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = (e) => {
    e.stopPropagation();
    setShowModal(false);
    setDetails(null);
    setError(null);
  };
  // const query = encodeURIComponent(`${place.name}, Montreal`);
  // const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return (
    <>
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
          ${isHighlighted 
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
  {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: '90vw',
              maxWidth: 400,
              minHeight: 200,
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                zIndex: 10,
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={handleClose}
            >Close</button>
            {loading && <div>Loading details…</div>}
            {error && <div style={{color:'red'}}>{error}</div>}
            {details && (
              <>
                <h2 style={{margin:0, fontSize: '1.3rem', fontWeight: 700}}>{details.name}</h2>
                <div style={{color:'#555', fontSize:'1rem'}}>{details.formatted_address || 'Address not available'}</div>
                {details.rating && (
                  <div style={{color:'#888'}}>Rating: {details.rating} / 5</div>
                )}
                {details.opening_hours && details.opening_hours.weekday_text && (
                  <div style={{marginTop:8}}>
                    <b>Hours:</b>
                    <ul style={{margin:0, paddingLeft:16, color:'#666', fontSize:'0.95rem'}}>
                      {details.opening_hours.weekday_text.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  </div>
                )}
                {details.formatted_phone_number && (
                  <div style={{marginTop:8}}>Phone: {details.formatted_phone_number}</div>
                )}
                {details.website && (
                  <div style={{marginTop:8}}><a href={details.website} target="_blank" rel="noopener noreferrer">Website</a></div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}