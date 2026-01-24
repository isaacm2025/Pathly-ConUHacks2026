export default function StatusPill({ status, isDark = false }) {
  const config = {
    not_busy: {
      label: "Not Busy",
      dot: "bg-emerald-500",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
      text: isDark ? "text-emerald-400" : "text-emerald-700"
    },
    moderate: {
      label: "Moderate",
      dot: "bg-amber-500",
      bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
      text: isDark ? "text-amber-400" : "text-amber-700"
    },
    busy: {
      label: "Busy",
      dot: "bg-rose-500",
      bg: isDark ? "bg-rose-500/10" : "bg-rose-50",
      text: isDark ? "text-rose-400" : "text-rose-700"
    }
  };
  
  const { label, dot, bg, text } = config[status] || config.moderate;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}