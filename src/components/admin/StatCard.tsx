import type { LucideIcon } from 'lucide-react';

export function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-surface-border bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
