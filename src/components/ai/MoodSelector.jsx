import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coffee, Dumbbell, BookOpen, Users, Moon, Zap, Heart, X, Loader2 } from "lucide-react";
import { getMoodBasedRecommendations, isAIEnabled } from "../../api/geminiApi";

const MOODS = [
  { id: "productive", label: "Productive", icon: Zap, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "social", label: "Social", icon: Users, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "relaxed", label: "Relaxed", icon: Coffee, color: "bg-green-100 text-green-700 border-green-200" },
  { id: "energetic", label: "Energetic", icon: Dumbbell, color: "bg-red-100 text-red-700 border-red-200" },
  { id: "focused", label: "Focused", icon: BookOpen, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "romantic", label: "Date Night", icon: Heart, color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "quiet", label: "Quiet Time", icon: Moon, color: "bg-slate-100 text-slate-700 border-slate-200" },
];

export default function MoodSelector({ places, onRecommendations }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const aiEnabled = isAIEnabled();

  const handleMoodSelect = async (mood) => {
    if (!aiEnabled) return;
    
    setSelectedMood(mood.id);
    setIsLoading(true);
    setRecommendations(null);

    try {
      const result = await getMoodBasedRecommendations(places, mood.label);
      setRecommendations(result);
      if (result?.recommendations) {
        onRecommendations?.(result.recommendations);
      }
    } catch (error) {
      console.error('Failed to get mood recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMood = () => {
    setSelectedMood(null);
    setRecommendations(null);
    onRecommendations?.(null);
  };

  if (!aiEnabled) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 mb-2"
      >
        <Sparkles className="w-4 h-4" />
        {isExpanded ? "Hide AI Mood Match" : "What's your vibe?"}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="flex flex-wrap gap-2 mb-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleMoodSelect(mood)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedMood === mood.id
                        ? `${mood.color} ring-2 ring-offset-1 ring-purple-300`
                        : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    <mood.icon className="w-3.5 h-3.5" />
                    {mood.label}
                  </button>
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-purple-600 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding places that match your vibe...
                </div>
              )}

              {recommendations?.recommendations && !isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                      AI Picks for You
                    </span>
                    <button
                      onClick={clearMood}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {recommendations.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-white rounded-lg"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium text-slate-900 text-sm">{rec.name}</span>
                        <p className="text-xs text-slate-500">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
