import ModeToggle from "../mode/ModeToggle";
import LiveIndicator from "./LiveIndicator";
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