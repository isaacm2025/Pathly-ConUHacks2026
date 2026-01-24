import ModeToggle from "../mode/ModeToggle";
import LiveIndicator from "./LiveIndicator";
import { User } from "lucide-react";

export default function TopBar({ mode, onModeToggle, lastUpdate, isDark }) {
  return (
    <div className={`
      flex items-center justify-between px-4 py-3
      ${isDark ? "bg-slate-900" : "bg-white"}
    `}>
      <ModeToggle mode={mode} onToggle={onModeToggle} />
      
      <LiveIndicator lastUpdate={lastUpdate} isDark={isDark} />
      
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
  );
}