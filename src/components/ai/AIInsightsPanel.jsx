import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, Lightbulb, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { generatePlaceInsights, getBestTimeToVisit, getLocalTips, isAIEnabled } from "../../api/geminiApi";

export default function AIInsightsPanel({ place, userPreferences, timeContext, isExpanded, onToggle }) {
  const [insight, setInsight] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [tips, setTips] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insight');

  const aiEnabled = isAIEnabled();

  useEffect(() => {
    if (isExpanded && aiEnabled && !insight) {
      loadInsights();
    }
  }, [isExpanded, place?.id]);

  const loadInsights = async () => {
    if (!aiEnabled || !place) return;
    
    setIsLoading(true);
    try {
      const [insightResult, bestTimeResult, tipsResult] = await Promise.all([
        generatePlaceInsights(place, userPreferences, timeContext),
        getBestTimeToVisit(place),
        getLocalTips(place)
      ]);
      
      setInsight(insightResult);
      setBestTime(bestTimeResult);
      setTips(tipsResult);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!aiEnabled) return null;

  return (
    <div className="mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Insights
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <span className="ml-2 text-sm text-purple-600">Getting AI insights...</span>
                </div>
              ) : (
                <>
                  {/* Tab buttons */}
                  <div className="flex gap-1 mb-3">
                    {[
                      { id: 'insight', label: 'For You', icon: Sparkles },
                      { id: 'time', label: 'Best Time', icon: Clock },
                      { id: 'tips', label: 'Local Tips', icon: Lightbulb }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(tab.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/60 text-purple-700 hover:bg-white'
                        }`}
                      >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="text-sm text-slate-700">
                    {activeTab === 'insight' && (
                      <p className="leading-relaxed">
                        {insight || "Click to generate personalized insights..."}
                      </p>
                    )}

                    {activeTab === 'time' && bestTime && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-700">Best time:</span>
                          <span className="px-2 py-0.5 bg-white rounded-full text-purple-600 font-medium">
                            {bestTime.bestTime}
                          </span>
                        </div>
                        <p className="text-slate-600">{bestTime.reason}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">Expected crowd:</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            bestTime.crowdPrediction === 'low' 
                              ? 'bg-green-100 text-green-700'
                              : bestTime.crowdPrediction === 'moderate'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {bestTime.crowdPrediction}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tips' && tips?.tips && (
                      <ul className="space-y-2">
                        {tips.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
