import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RefreshCw } from "lucide-react";

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default function AISuggestionButton({ places = [], isDark = false, userLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestion = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setSuggestion("AI suggestions require a Gemini API key. Add VITE_GEMINI_API_KEY to your .env.local file.");
      return;
    }

    setIsLoading(true);
    
    const placesList = places.slice(0, 5).map(p => 
      `${p.name} (${p.type || 'venue'}, ${p.status || 'unknown'} crowd, ${p.eta_minutes || '?'} min away)`
    ).join('\n');

    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night';

    const prompt = `You are a friendly local guide in Montreal. Based on the time (${timeOfDay}) and these nearby places:

${placesList || 'Various local spots'}

Give ONE short, personalized suggestion (2-3 sentences max) about where to go or what to do right now. Be specific, casual, and helpful - like a friend giving advice. Don't use bullet points or lists.`;

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 150 }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Gemini API error:', data);
        throw new Error(data.error?.message || 'API error');
      }
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate suggestion.';
      setSuggestion(text);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setSuggestion(`Couldn't get a suggestion: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [places]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!suggestion) {
      generateSuggestion();
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg 
          ${isDark 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}
          font-medium text-sm hover:shadow-xl transition-shadow`}
      >
        <Sparkles className="w-4 h-4" />
        AI Suggestion
      </motion.button>

      {/* Suggestion Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`absolute bottom-16 right-4 z-30 w-80 rounded-2xl shadow-2xl overflow-hidden
              ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b
              ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AI Suggestion
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={generateSuggestion}
                  disabled={isLoading}
                  className={`p-1.5 rounded-lg transition-colors
                    ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors
                    ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-pulse" />
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Thinking...
                    </p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {suggestion || "Click refresh to get a personalized suggestion!"}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 text-center border-t
              ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                ✨ Powered by Gemini AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
