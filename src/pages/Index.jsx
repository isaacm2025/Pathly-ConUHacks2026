import { useEffect } from "react";
import { createPageUrl } from "../utils";

export default function Index() {
  useEffect(() => {
    // Always route through the landing page first.
    window.location.href = createPageUrl("Landing");
  }, []);
  
  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
