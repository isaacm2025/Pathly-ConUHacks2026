import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, Loader2, Sparkles, Clock, Star, Users } from "lucide-react";
import { comparePlaces, isAIEnabled } from "../../api/geminiApi";

export default function PlaceCompareButton({ places, selectedPlaceId, userPreferences }) {
  const [isOpen, setIsOpen] = useState(false);
  const [compareWith, setCompareWith] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const aiEnabled = isAIEnabled();
  const selectedPlace = places.find(p => p.id === selectedPlaceId);
  const availablePlaces = places.filter(p => p.id !== selectedPlaceId);

  const handleCompare = async (place2) => {
    if (!selectedPlace || !aiEnabled) return;
    
    setCompareWith(place2);
    setIsLoading(true);
    setComparison(null);

    try {
      const result = await comparePlaces(selectedPlace, place2, userPreferences);
      setComparison(result);
    } catch (error) {
      console.error('Comparison failed:', error);
      setComparison("Unable to generate comparison. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCompareWith(null);
    setComparison(null);
  };

  if (!selectedPlace || !aiEnabled) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
      >
        <Scale className="w-4 h-4" />
        Compare with another
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white sticky top-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Compare Places</h2>
                      <p className="text-indigo-200 text-sm">AI-powered decision helper</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Selected Place */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Currently Selected
                  </p>
                  <PlaceCompareCard place={selectedPlace} highlight />
                </div>

                {/* Select place to compare */}
                {!compareWith ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Compare with...
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availablePlaces.slice(0, 8).map(place => (
                        <button
                          key={place.id}
                          onClick={() => handleCompare(place)}
                          className="p-3 text-left bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 border border-slate-100 transition-colors"
                        >
                          <p className="font-medium text-slate-800 truncate text-sm">{place.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {place.eta_minutes}m
                            </span>
                            {place.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {place.rating}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Comparison View */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Comparing with
                      </p>
                      <PlaceCompareCard place={compareWith} />
                    </div>

                    {/* AI Analysis */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-800">AI Analysis</span>
                      </div>
                      
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                          <span className="ml-2 text-sm text-purple-600">Analyzing...</span>
                        </div>
                      ) : comparison ? (
                        <p className="text-sm text-slate-700 leading-relaxed">{comparison}</p>
                      ) : null}
                    </div>

                    {/* Try another */}
                    <button
                      onClick={() => {
                        setCompareWith(null);
                        setComparison(null);
                      }}
                      className="mt-4 w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Compare with a different place
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PlaceCompareCard({ place, highlight = false }) {
  const statusColors = {
    not_busy: "bg-green-100 text-green-700",
    moderate: "bg-amber-100 text-amber-700",
    busy: "bg-red-100 text-red-700"
  };

  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
      <h3 className="font-semibold text-slate-900">{place.name}</h3>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
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
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[place.status] || statusColors.moderate}`}>
          <Users className="w-3 h-3" />
          {place.status === 'not_busy' ? 'Quiet' : place.status === 'busy' ? 'Busy' : 'Moderate'}
        </span>
      </div>
    </div>
  );
}
