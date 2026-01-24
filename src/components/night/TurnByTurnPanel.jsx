import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowRight, Navigation, Clock, AlertTriangle, Share2 } from "lucide-react";
import { useState } from "react";

const mockDirections = [
  { id: 1, instruction: "Head north on Rue Saint-Denis", distance: "120 m", icon: "up" },
  { id: 2, instruction: "Turn right onto Boulevard de Maisonneuve", distance: "450 m", icon: "right", alert: "High traffic area" },
  { id: 3, instruction: "Continue straight", distance: "230 m", icon: "up" },
  { id: 4, instruction: "Turn right onto Rue Berri", distance: "180 m", icon: "right", alert: "Poor lighting" },
  { id: 5, instruction: "Arrive at destination", distance: "0 m", icon: "destination" }
];

export default function TurnByTurnPanel({ route, destination, onShare }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  if (!route) return null;
  
  const getIcon = (iconType) => {
    switch (iconType) {
      case "up": return ArrowUpRight;
      case "right": return ArrowRight;
      case "destination": return Navigation;
      default: return ArrowUpRight;
    }
  };
  
  const arrivalTime = new Date(Date.now() + route.eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Navigation Active</h3>
          </div>
          <button
            onClick={onShare}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <Share2 className="w-4 h-4 text-slate-300" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-4 h-4" />
            <span>Arrive by <span className="text-white font-medium">{arrivalTime}</span></span>
          </div>
          <div className="text-slate-500">•</div>
          <div className="text-slate-300">
            {route.eta} min • Safety: <span className="text-emerald-400 font-medium">{route.safetyScore}</span>
          </div>
        </div>
      </div>
      
      {/* Directions List */}
      <div className="max-h-[400px] overflow-y-auto">
        {mockDirections.map((direction, index) => {
          const Icon = getIcon(direction.icon);
          const isActive = index === currentStep;
          const isPassed = index < currentStep;
          
          return (
            <div
              key={direction.id}
              className={`
                p-4 border-b border-slate-700/50 transition-all
                ${isActive ? "bg-emerald-500/10" : isPassed ? "opacity-50" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Step indicator */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isActive 
                    ? "bg-emerald-500 text-white" 
                    : isPassed 
                      ? "bg-slate-600 text-slate-400" 
                      : "bg-slate-700 text-slate-400"
                  }
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Instruction */}
                <div className="flex-1">
                  <p className={`font-medium ${isActive ? "text-white" : "text-slate-300"}`}>
                    {direction.instruction}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{direction.distance}</p>
                  
                  {/* Safety Alert */}
                  {direction.alert && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-200">{direction.alert}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress simulation - for demo */}
      <div className="p-3 bg-slate-800/80 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(mockDirections.length - 1, currentStep + 1))}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Next
          </button>
          <span className="ml-auto">Step {currentStep + 1} of {mockDirections.length}</span>
        </div>
      </div>
    </motion.div>
  );
}