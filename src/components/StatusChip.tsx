// src/components/StatusChip.tsx
import clsx from 'clsx';

export interface StatusChipProps {
  /** The current status label */
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  // Map of statuses → Tailwind utility classes
  const colorMap: Record<string, string> = {
    READY: 'bg-green-100 text-green-700',
    'IN PROGRESS': 'bg-amber-100 text-amber-700 animate-pulse',
    BLOCKED: 'bg-red-100 text-red-700',
  };

  // Base pill styling
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1';

  // Fallback to gray if status not recognized
  const statusClasses = colorMap[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span className={clsx(baseClasses, statusClasses)}>
      {/* leading dot */}
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
