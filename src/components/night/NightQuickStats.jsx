import { motion } from "framer-motion";
import { TrendingUp, Users, Lightbulb, Activity } from "lucide-react";

export default function NightQuickStats({ streetActivity, userLocation }) {
  // Calculate stats from street activity data
  const hour = new Date().getHours();
  
  // Mock activity level based on time (would use real data)
  const getActivityLevel = () => {
    if (hour >= 22 || hour < 6) return { level: "Low", percent: 25, color: "amber" };
    if (hour >= 18 || hour < 22) return { level: "Moderate", percent: 55, color: "emerald" };
    return { level: "High", percent: 80, color: "emerald" };
  };

  const activity = getActivityLevel();
  
  // Calculate nearby lit areas (mock data)
  const litStreets = streetActivity?.segments?.filter(s => s.lighting > 0.6).length || 0;
  const totalStreets = streetActivity?.segments?.length || 10;
  const lightingPercent = Math.round((litStreets / totalStreets) * 100) || 68;

  const stats = [
    {
      icon: Activity,
      label: "Street Activity",
      value: activity.level,
      subValue: `${activity.percent}% of normal`,
      color: activity.color,
    },
    {
      icon: Lightbulb,
      label: "Lighting Coverage",
      value: `${lightingPercent}%`,
      subValue: "Well-lit streets",
      color: lightingPercent > 60 ? "emerald" : "amber",
    },
    {
      icon: Users,
      label: "Pedestrians Nearby",
      value: hour >= 22 || hour < 6 ? "Few" : "Moderate",
      subValue: "Based on time",
      color: hour >= 22 || hour < 6 ? "amber" : "emerald",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <stat.icon className={`w-3.5 h-3.5 ${
              stat.color === "emerald" ? "text-emerald-400" : "text-amber-400"
            }`} />
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</span>
          </div>
          <div className={`text-lg font-semibold ${
            stat.color === "emerald" ? "text-emerald-400" : "text-amber-400"
          }`}>
            {stat.value}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{stat.subValue}</div>
        </motion.div>
      ))}
    </div>
  );
}
