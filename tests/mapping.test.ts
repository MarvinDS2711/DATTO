import { describe, expect, it } from "vitest";
import {
  categoryFromContext,
  mapAlert,
  mapAntivirus,
  mapDevice,
  mapDeviceType,
  mapPatchStatus,
  mapPriority,
  toIso,
} from "@/lib/datto/mapping";

describe("mapping Datto → domaine", () => {
  it("convertit les dates epoch en ISO", () => {
    expect(toIso(1760000000000)).toBe("2025-10-09T08:53:20.000Z");
    expect(toIso("1760000000000")).toBe("2025-10-09T08:53:20.000Z");
    expect(toIso(undefined)).toBe("1970-01-01T00:00:00.000Z");
  });

  it("reconnaît les types d'appareils", () => {
    expect(mapDeviceType({ category: "Server" })).toBe("server");
    expect(mapDeviceType({ category: "Laptop" })).toBe("laptop");
    expect(mapDeviceType({ category: "Desktop" })).toBe("workstation");
    expect(mapDeviceType({ category: "Network Device" })).toBe("network");
    expect(mapDeviceType(null)).toBe("other");
  });

  it("traduit les statuts antivirus et correctifs", () => {
    expect(mapAntivirus({ antivirusStatus: "RunningAndNotUpToDate" })).toBe("running");
    expect(mapAntivirus({ antivirusStatus: "NotRunning" })).toBe("not-running");
    expect(mapAntivirus({ antivirusStatus: "NotDetected" })).toBe("not-detected");
    expect(mapPatchStatus({ patchStatus: "FullyPatched" })).toBe("up-to-date");
    expect(mapPatchStatus({ patchStatus: "ApprovedPending" })).toBe("pending");
    expect(mapPatchStatus({ patchStatus: "InstallError" })).toBe("failed");
    expect(mapPatchStatus({ patchStatus: "NoPolicy" })).toBe("unknown");
  });

  it("traduit les priorités et catégories d'alerte", () => {
    expect(mapPriority("Critical")).toBe("critical");
    expect(mapPriority("Moderate")).toBe("moderate");
    expect(mapPriority("Information")).toBe("information");
    expect(mapPriority(undefined)).toBe("information");
    expect(categoryFromContext({ "@class": "online_offline_status_ctx" })).toBe("Online offline status");
    expect(categoryFromContext({})).toBe("Alerte");
  });

  it("ignore les éléments sans identifiant au lieu de planter", () => {
    expect(mapDevice({ hostname: "X" })).toBeNull();
    expect(mapAlert({ priority: "High" })).toBeNull();
  });

  it("tolère une alerte incomplète", () => {
    expect(mapAlert({ alertUid: "a1" })).toMatchObject({
      uid: "a1",
      priority: "information",
      message: "Alerte sans description",
      resolved: false,
    });
  });
});
