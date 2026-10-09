import type { Alert, AlertPriority } from "@/lib/datto/types";
import { formatRelative } from "@/lib/utils/format";
import { LinkCard } from "./Card";
import { PriorityBadge } from "./StatusBadge";

const ACCENT: Record<AlertPriority, string> = {
  critical: "border-l-critical",
  high: "border-l-high",
  moderate: "border-l-moderate",
  low: "border-l-low",
  information: "border-l-info",
};

export function AlertCard({ alert, hostname }: { alert: Alert; hostname?: string }) {
  return (
    <LinkCard href={`/alertes/${alert.uid}`} accent={ACCENT[alert.priority]}>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={alert.priority} />
        <span className="truncate text-xs text-muted">{alert.category}</span>
        <span className="ml-auto shrink-0 text-xs text-muted">{formatRelative(alert.createdAt)}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[15px] leading-snug">{alert.message}</p>
      {hostname && <p className="mt-1 truncate text-xs font-medium text-muted">{hostname}</p>}
      {alert.resolved && <p className="mt-1 text-xs font-semibold text-ok">Résolue</p>}
    </LinkCard>
  );
}
