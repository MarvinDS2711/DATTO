import type { AlertPriority } from "@/lib/datto/types";
import { PRIORITY_LABEL } from "@/lib/utils/format";

const PRIORITY_CLASS: Record<AlertPriority, string> = {
  critical: "bg-critical text-white",
  high: "bg-high text-black",
  moderate: "bg-moderate text-black",
  low: "bg-low text-black",
  information: "bg-surface-2 text-muted",
};

export function PriorityBadge({ priority }: { priority: AlertPriority }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_CLASS[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${online ? "text-ok" : "text-critical"}`}>
      <span className={`size-2 rounded-full ${online ? "bg-ok" : "bg-critical"}`} aria-hidden="true" />
      {online ? "En ligne" : "Hors ligne"}
    </span>
  );
}
