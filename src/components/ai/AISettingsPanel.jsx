import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Key, Eye, EyeOff, Check, X, ExternalLink } from "lucide-react";

export default function AISettingsPanel({ apiKey, onApiKeyChange, isOpen, onClose }) {
  const [inputKey, setInputKey] = useState(apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onApiKeyChange(inputKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    setInputKey("");
    onApiKeyChange("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">AI Features</h2>
                    <p className="text-purple-200 text-sm">Powered by Gemini</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showKey ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 text-sm">
                <p className="text-purple-800 font-medium mb-2">What you get with AI:</p>
                <ul className="space-y-1.5 text-purple-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    Personalized place recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    Best time to visit predictions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    Mood-based place matching
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" />
                    Local insider tips
                  </li>
                </ul>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Get a free Gemini API key
              </a>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {apiKey && (
                  <button
                    onClick={handleClear}
                    className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!inputKey.trim()}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                    isSaved
                      ? "bg-green-500 text-white"
                      : inputKey.trim()
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isSaved ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Saved!
                    </span>
                  ) : (
                    "Save & Enable AI"
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
