import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ParticleField from "../components/landing/ParticleField";
import LogoReveal from "../components/landing/LogoReveal";
import GetStartedButton from "../components/landing/GetStartedButton";
import AudioButton from "../components/landing/AudioButton";
import useElevenLabsTTS from "../hooks/useElevenLabsTTS";
import { createPageUrl } from "../utils";

const LANDING_TEXT = "Welcome to Pathly. Navigate your night with confidence and comfort.";

export default function Landing() {
  const navigate = useNavigate();
  const [showLogo, setShowLogo] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isDisintegrating, setIsDisintegrating] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { speak, stop, isLoading, isPlaying, error } = useElevenLabsTTS();
  
  useEffect(() => {
    // Check if user has already seen landing
    const hasSeenLanding = localStorage.getItem("pathly_seen_landing");
    if (hasSeenLanding === "true" && window.location.pathname === "/Landing") {
      // Skip landing and go straight to dashboard
      window.location.href = createPageUrl("Home");
      return;
    }
    
    // Show logo after particles converge (3 seconds)
    const logoTimer = setTimeout(() => setShowLogo(true), 3000);
    
    // Show button after logo settles
    const buttonTimer = setTimeout(() => setShowButton(true), 3500);
    
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(buttonTimer);
    };
  }, []);
  
  const handleGetStarted = () => {
    setIsDisintegrating(true);
    stop();
    
    // Show dashboard underneath after brief delay
    setTimeout(() => {
      setShowDashboard(true);
    }, 400);
  };

  const handleAudioClick = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(LANDING_TEXT);
    }
  };
  
  const handleDisintegrationComplete = () => {
    // Mark landing as seen
    localStorage.setItem("pathly_seen_landing", "true");
    localStorage.setItem("pathly_show_login", "true");
    
    // Navigate to dashboard
    window.location.href = createPageUrl("Home");
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Dashboard Preview (fades in during disintegration) */}
      {showDashboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
            <div className="text-slate-400 text-sm">Loading dashboard...</div>
          </div>
        </motion.div>
      )}
      
      {/* Landing Experience Layer */}
      <motion.div
        animate={{ opacity: isDisintegrating ? 0 : 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-10"
      >
        {/* Particle Background */}
        <ParticleField 
          isDisintegrating={isDisintegrating}
          onComplete={handleDisintegrationComplete}
        />
        
        {/* Audio Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showButton ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-8 right-8 z-20"
        >
          <AudioButton
            onClick={handleAudioClick}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        </motion.div>
        
        {/* Logo & Brand */}
        <LogoReveal 
          isVisible={showLogo}
          isDisintegrating={isDisintegrating}
        />
        
        {/* CTA Button */}
        <GetStartedButton
          isVisible={showButton}
          onClick={handleGetStarted}
          isDisintegrating={isDisintegrating}
        />
      </motion.div>
      
      {/* Accessibility: Reduced motion fallback */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
