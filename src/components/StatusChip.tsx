import clsx from 'clsx';
export default function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: 'bg-green-100 text-green-700',
    'IN PROGRESS': 'bg-amber-100 text-amber-700 animate-pulse',
    BLOCKED: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={clsx(
        'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1',
        map[status] ?? 'bg-gray-100 text-gray-700'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
