import { useEffect } from "react";
import { createPageUrl } from "../utils";

export default function Index() {
  useEffect(() => {
    // Check if user has seen landing
    const hasSeenLanding = localStorage.getItem("pathly_seen_landing");
    
    if (hasSeenLanding === "true") {
      // Go straight to dashboard
      window.location.href = createPageUrl("Home");
    } else {
      // Show landing page
      window.location.href = createPageUrl("Landing");
    }
  }, []);
  
  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}