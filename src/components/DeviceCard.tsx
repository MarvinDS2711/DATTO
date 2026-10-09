import type { Device } from "@/lib/datto/types";
import { DEVICE_TYPE_LABEL, formatRelative } from "@/lib/utils/format";
import { LinkCard } from "./Card";
import { OnlineBadge } from "./StatusBadge";

export function DeviceCard({ device }: { device: Device }) {
  return (
    <LinkCard href={`/appareils/${device.uid}`} accent={device.online ? "border-l-ok" : "border-l-critical"}>
      <div className="flex items-center gap-2">
        <span className="truncate font-semibold">{device.hostname}</span>
        <span className="ml-auto shrink-0">
          <OnlineBadge online={device.online} />
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted">
        {DEVICE_TYPE_LABEL[device.type]} · {device.operatingSystem}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        Vu {formatRelative(device.lastSeen)}
        {device.rebootRequired && <span className="ml-2 font-semibold text-moderate">Redémarrage requis</span>}
      </p>
    </LinkCard>
  );
}
