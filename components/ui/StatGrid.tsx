import type { LucideIcon } from "lucide-react";

export interface Stat {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Chiffres clés sur trois colonnes (fiches pays et cibles nature). */
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl bg-surface-2 px-2 py-2">
          <dt className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-wide text-muted uppercase">
            <Icon size={11} />
            {label}
          </dt>
          <dd className="mt-0.5 truncate text-sm font-bold" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
