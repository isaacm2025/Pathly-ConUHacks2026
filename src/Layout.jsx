import { useEffect, useState } from "react";
import LoginOverlay from "@/components/landing/LoginOverlay";

export default function Layout({ children }) {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem("pathly_show_login") === "true";
    if (shouldShow && window.location.pathname === "/Home") {
      setShowLogin(true);
    }
  }, []);

  const handleLoginClose = () => {
    localStorage.setItem("pathly_show_login", "false");
    setShowLogin(false);
  };

  return (
    <div className="min-h-screen font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Leaflet overrides */
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 12px 16px;
        }
      `}</style>
      {children}
      {showLogin && <LoginOverlay onClose={handleLoginClose} />}
    </div>
  );
}
