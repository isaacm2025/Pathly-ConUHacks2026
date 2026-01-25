import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Loader2, Mic, MapPin, Shield, Navigation, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useElevenLabs } from '@/hooks/useElevenLabs';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export function VoiceNavigator({ destination, route, streetData, userLocation }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [briefingText, setBriefingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { speak, stop, isLoading: isSpeaking, isPlaying, error } = useElevenLabs();

  // Calculate activity level from street data
  const getActivityInfo = () => {
    if (!streetData || !Array.isArray(streetData) || streetData.length === 0) {
      return { level: 'moderate', percentage: 50 };
    }
    const totalPeople = streetData.reduce((sum, street) => sum + (street.people || 0), 0);
    const avgPeople = totalPeople / streetData.length;
    const level = avgPeople > 80 ? 'high' : avgPeople > 40 ? 'moderate' : 'low';
    return { level, percentage: Math.min(100, Math.round(avgPeople)) };
  };

  // Generate navigation briefing with Gemini
  const generateBriefing = useCallback(async () => {
    if (!GEMINI_API_KEY) {
      setBriefingText('AI briefing unavailable - API key not configured');
      return null;
    }

    setIsGenerating(true);

    const hour = new Date().getHours();
    const timeContext = hour >= 22 || hour < 5 ? 'late night' : hour >= 18 ? 'evening' : 'daytime';
    const activityInfo = getActivityInfo();
    
    const prompt = `You are a friendly walking navigation assistant for Pathly, a safety-focused walking app. Generate a brief, conversational voice navigation briefing (2-3 sentences max) for someone walking to their destination.

Context:
- Destination: ${destination || 'selected location'}
- Time: ${timeContext}
- Street activity level: ${activityInfo.level} (${activityInfo.percentage}% activity score)
- Estimated walking time: ${route?.eta || '10-15'} minutes
- Weather: Clear

Keep it natural, reassuring, and focused on safety. Don't use bullet points. Speak directly to the user like a helpful friend. Include one specific safety tip relevant to the time of day.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 150,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate briefing');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Ready to guide you safely to your destination.';
      setBriefingText(text);
      return text;
    } catch (err) {
      console.error('Gemini error:', err);
      const activityInfo = getActivityInfo();
      const fallback = `Heading to ${destination || 'your destination'}. The route looks ${activityInfo.level === 'high' ? 'busy' : 'clear'} right now. Stay aware of your surroundings and keep your phone accessible.`;
      setBriefingText(fallback);
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  }, [destination, route, streetData]);

  // Generate and speak the briefing
  const handleStartVoiceNav = useCallback(async () => {
    setIsExpanded(true);
    const text = await generateBriefing();
    if (text) {
      await speak(text);
    }
  }, [generateBriefing, speak]);

  // Stop voice and collapse
  const handleStop = useCallback(() => {
    stop();
    setIsExpanded(false);
    setBriefingText('');
  }, [stop]);

  // Regenerate briefing
  const handleRegenerate = useCallback(async () => {
    const text = await generateBriefing();
    if (text) {
      await speak(text);
    }
  }, [generateBriefing, speak]);

  return (
    <>
      {/* Floating Voice Navigator Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-32 right-4 z-50"
          >
            <Button
              onClick={handleStartVoiceNav}
              disabled={isGenerating || isSpeaking}
              className="rounded-full w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/30"
            >
              {isGenerating || isSpeaking ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              Voice Guide
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Voice Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-500/20 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">AI Voice Guide</h3>
                    <p className="text-white/50 text-xs">Powered by Gemini + ElevenLabs</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Destination Info */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-white/80 text-sm truncate">
                    {destination || 'Your destination'}
                  </span>
                </div>

                {/* Briefing Text */}
                <div className="bg-white/5 rounded-xl p-3 mb-4 min-h-[60px]">
                  {isGenerating ? (
                    <div className="flex items-center gap-2 text-white/60">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Generating briefing...</span>
                    </div>
                  ) : (
                    <p className="text-white/90 text-sm leading-relaxed">
                      {briefingText || 'Tap play to hear your navigation briefing.'}
                    </p>
                  )}
                </div>

                {/* Audio Visualizer (when playing) */}
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-1 mb-4"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-purple-400 rounded-full"
                        animate={{
                          height: [8, 20, 8],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isGenerating || isSpeaking}
                    className="border-white/20 text-white/80 hover:bg-white/10"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    New Briefing
                  </Button>
                  
                  <Button
                    onClick={isPlaying ? stop : () => speak(briefingText)}
                    disabled={isGenerating || !briefingText}
                    className={`px-6 ${
                      isPlaying
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                    }`}
                  >
                    {isSpeaking ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : isPlaying ? (
                      <VolumeX className="w-4 h-4 mr-1" />
                    ) : (
                      <Volume2 className="w-4 h-4 mr-1" />
                    )}
                    {isPlaying ? 'Stop' : 'Play'}
                  </Button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg p-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Safety Badge */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 bg-green-500/10 rounded-lg p-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs">
                    Voice navigation keeps your eyes on the street
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default VoiceNavigator;
