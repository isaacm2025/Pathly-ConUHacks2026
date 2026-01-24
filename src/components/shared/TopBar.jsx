import ModeToggle from "../mode/ModeToggle";
import LiveIndicator from "./LiveIndicator";

import { User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function TopBar({ mode, onModeToggle, lastUpdate, isDark }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.username || user?.name || user?.email || "User";
  const detailLabel = user?.email || user?.role || user?.id || "Profile";

import { User, Settings, Clock } from "lucide-react";

export default function TopBar({
  mode,
  onModeToggle,
  lastUpdate,
  isDark,
  onOpenPreferences,
  autoModeEnabled,
  timeContext
}) {

  return (
    <div className={`
      flex items-center justify-between px-4 py-3
      ${isDark ? "bg-slate-900" : "bg-white"}
    `}>
      <div className="flex items-center gap-4">
        <ModeToggle mode={mode} onToggle={onModeToggle} />

        {/* Auto Mode Indicator */}
        {autoModeEnabled && (
          <span className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${isDark ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-600"}
          `}>
            <Clock className="w-3 h-3" />
            Auto
          </span>
        )}
      </div>

      <LiveIndicator lastUpdate={lastUpdate} isDark={isDark} />

      
      {isAuthenticated ? (
        <button className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          transition-colors
          ${isDark 
            ? "bg-slate-800 text-slate-200 hover:bg-slate-700" 
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }
        `}>
          <span className={`
            w-9 h-9 rounded-full flex items-center justify-center
            ${isDark ? "bg-slate-700 text-slate-200" : "bg-white text-slate-500"}
          `}>
            <User className="w-4 h-4" />
          </span>
          <span className="flex flex-col leading-tight text-left max-w-[160px]">
            <span className="text-xs font-semibold truncate">{displayName}</span>
            <span className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {detailLabel}
            </span>
          </span>
        </button>
      ) : (
        <button
          onClick={() => navigate("/SignUp")}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full
            transition-colors
            ${isDark 
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }
          `}
        >
          <span className={`
            w-9 h-9 rounded-full flex items-center justify-center
            ${isDark ? "bg-slate-700 text-slate-200" : "bg-white text-slate-500"}
          `}>
            <User className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold">Sign up</span>
        </button>
      )}


      <div className="flex items-center gap-2">
        {/* Preferences Button */}
        <button
          onClick={onOpenPreferences}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center
            transition-colors
            ${isDark
              ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }
          `}
          title="Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Button */}
        <button className={`
          w-9 h-9 rounded-full flex items-center justify-center
          transition-colors
          ${isDark
            ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }
        `}>
          <User className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
