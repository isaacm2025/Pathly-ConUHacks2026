import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ShareRouteModal({ isOpen, onClose, route, destination }) {
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  
  const routeLink = `https://pathly.app/route/${route?.id}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(routeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSend = () => {
    // In real app, this would send via API
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
      setContactEmail("");
      setMessage("");
    }, 2000);
  };
  
  if (!route) return null;
  
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Share Route</h3>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Share your {route.type} route to {destination?.label || "destination"}
                </p>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Route Summary */}
                <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">ETA</span>
                    <span className="text-white font-medium">{route.eta} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-slate-400">Safety Score</span>
                    <span className="text-emerald-400 font-medium">{route.safetyScore}</span>
                  </div>
                </div>
                
                {/* Share Link */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Share link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={routeLink}
                      readOnly
                      className="flex-1 px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Send to Contact */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Send to contact</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                {/* Optional Message */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="I'm on my way home..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!contactEmail || sent}
                  className={`
                    w-full py-3 rounded-lg font-medium text-white transition-all
                    flex items-center justify-center gap-2
                    ${sent 
                      ? "bg-emerald-600" 
                      : contactEmail 
                        ? "bg-emerald-500 hover:bg-emerald-600" 
                        : "bg-slate-700 cursor-not-allowed"
                    }
                  `}
                >
                  {sent ? (
                    <>
                      <Check className="w-5 h-5" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Share Route
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}