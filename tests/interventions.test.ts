import { describe, expect, it } from "vitest";
import { redact, REDACTED } from "@/lib/audit/redact";
import { can, type CurrentUser } from "@/lib/auth/permissions";
import { interventionCatalog, listInterventions, validateInterventionParams } from "@/lib/interventions/catalog";
import { evaluateInterventionRequest } from "@/lib/interventions/request";

const admin: CurrentUser = { id: "u-admin", displayName: "Admin", role: "admin", isDemo: true };
const viewer: CurrentUser = { id: "u-viewer", displayName: "Lecteur", role: "viewer", isDemo: true };

describe("catalogue d'interventions", () => {
  it("garde toutes les interventions désactivées en phase 1", () => {
    expect(listInterventions().every((a) => a.status === "disabled")).toBe(true);
  });

  it("exige une confirmation pour le redémarrage et l'AD", () => {
    expect(interventionCatalog["device.reboot"].requiresConfirmation).toBe(true);
    expect(interventionCatalog["ad.password-reset"].requiresConfirmation).toBe(true);
  });

  it("refuse les noms de service contenant des caractères d'injection", () => {
    for (const serviceName of ["Spooler; Remove-Item C:\\", "a|b", "$(whoami)", "x`y", "a&b"]) {
      expect(validateInterventionParams("service.restart", { deviceUid: "dev-1", serviceName }).ok).toBe(false);
    }
    expect(validateInterventionParams("service.restart", { deviceUid: "dev-1", serviceName: "Spooler" }).ok).toBe(true);
  });

  it("refuse les paramètres supplémentaires (pas de commande libre)", () => {
    const result = validateInterventionParams("device.reboot", { deviceUid: "dev-1", script: "Get-Process" });
    expect(result.ok).toBe(false);
  });

  it("valide l'identifiant AD", () => {
    expect(validateInterventionParams("ad.password-reset", { deviceUid: "dc-1", samAccountName: "j.dupont" }).ok).toBe(
      true,
    );
    expect(validateInterventionParams("ad.password-reset", { deviceUid: "dc-1", samAccountName: "a*" }).ok).toBe(false);
  });
});

describe("permissions", () => {
  it("limite le rôle lecteur à la lecture", () => {
    expect(can("viewer", "read")).toBe(true);
    expect(can("viewer", "intervention:device.reboot")).toBe(false);
  });

  it("réserve la réinitialisation AD à l'administrateur", () => {
    expect(can("technician", "intervention:service.restart")).toBe(true);
    expect(can("technician", "intervention:ad.password-reset")).toBe(false);
    expect(can("admin", "intervention:ad.password-reset")).toBe(true);
  });
});

describe("evaluateInterventionRequest", () => {
  const valid = { interventionId: "device.reboot", params: { deviceUid: "mock-dev-01" }, confirmed: true };

  it("n'exécute jamais rien, même pour une demande valide d'un administrateur", () => {
    const decision = evaluateInterventionRequest(admin, valid);
    expect(decision.httpStatus).toBe(501);
    expect(decision.body.executed).toBe(false);
    expect(decision.audit.outcome).toBe("not-implemented");
  });

  it("refuse sans permission", () => {
    expect(evaluateInterventionRequest(viewer, valid).httpStatus).toBe(403);
  });

  it("refuse sans confirmation explicite", () => {
    expect(evaluateInterventionRequest(admin, { ...valid, confirmed: undefined }).httpStatus).toBe(400);
  });

  it("refuse une intervention inconnue ou un corps invalide", () => {
    expect(evaluateInterventionRequest(admin, { ...valid, interventionId: "powershell.run" }).httpStatus).toBe(404);
    expect(evaluateInterventionRequest(admin, "n'importe quoi").httpStatus).toBe(400);
  });

  it("ne transmet pas de mot de passe au journal", () => {
    const decision = evaluateInterventionRequest(admin, {
      interventionId: "ad.password-reset",
      params: { deviceUid: "dc-1", samAccountName: "j.dupont", password: "Secret123!" },
      confirmed: true,
    });
    // Paramètre non prévu : rejeté avant toute suite, et absent du journal.
    expect(decision.httpStatus).toBe(422);
    expect(JSON.stringify(decision.audit)).not.toContain("Secret123!");
  });
});

describe("redact", () => {
  it("masque les clés sensibles à toute profondeur", () => {
    const out = redact({ user: "a", password: "x", nested: { apiKey: "k", list: [{ token: "t", ok: 1 }] } });
    expect(out).toEqual({ user: "a", password: REDACTED, nested: { apiKey: REDACTED, list: [{ token: REDACTED, ok: 1 }] } });
  });
});
