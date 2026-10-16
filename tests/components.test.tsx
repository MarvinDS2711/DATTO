import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav, isActive } from "@/components/BottomNav";
import { MockBanner } from "@/components/MockBanner";
import { OnlineBadge, PriorityBadge } from "@/components/StatusBadge";
import { formatRelative } from "@/lib/utils/format";

vi.mock("next/navigation", () => ({ usePathname: () => "/alertes/mock-alert-01" }));

describe("BottomNav", () => {
  it("affiche les 5 entrées et marque la page active", () => {
    render(<BottomNav criticalCount={3} />);
    for (const label of ["Accueil", "Alertes", "Appareils", "Interventions", "Profil"]) {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: /Alertes/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByLabelText("3 alertes critiques")).toBeTruthy();
  });

  it("calcule la page active", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/alertes", "/")).toBe(false);
    expect(isActive("/appareils/sites/x", "/appareils")).toBe(true);
  });
});

describe("badges", () => {
  it("affiche les libellés de statut", () => {
    render(
      <>
        <PriorityBadge priority="critical" />
        <OnlineBadge online={false} />
      </>,
    );
    expect(screen.getByText("Critique")).toBeTruthy();
    expect(screen.getByText("Hors ligne")).toBeTruthy();
  });

  it("signale clairement la maquette", () => {
    render(<MockBanner />);
    expect(screen.getByRole("note").textContent).toMatch(/données fictives/);
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("formate les durées", () => {
    expect(formatRelative("2026-01-01T11:55:00Z", now)).toBe("il y a 5 min");
    expect(formatRelative("2026-01-01T09:00:00Z", now)).toBe("il y a 3 h");
    expect(formatRelative("2025-12-30T12:00:00Z", now)).toBe("il y a 2 j");
  });
});
