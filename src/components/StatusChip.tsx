// src/components/StatusChip.tsx
import clsx from "clsx";

export interface StatusChipProps {
  /** The current status label */
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  // Map of statuses → Modern glassmorphism classes
  const colorMap: Record<string, string> = {
    READY: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300 shadow-green-500/10",
    "IN PROGRESS": "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-300 shadow-amber-500/10 animate-pulse",
    BLOCKED: "bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-400/30 text-red-300 shadow-red-500/10",
  };

  // Base pill styling with glassmorphism
  const baseClasses =
    "px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-2 backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105";

  // Fallback to neutral glassmorphism if status not recognized
  const statusClasses = colorMap[status] ?? "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/30 text-gray-300 shadow-gray-500/10";

  return (
    <span className={clsx(baseClasses, statusClasses)}>
      {/* Modern status indicator dot */}
      <span className="h-2 w-2 rounded-full bg-current shadow-lg" />
      {status}
    </span>
  );
}
