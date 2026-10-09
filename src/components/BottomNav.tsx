"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, HomeIcon, MonitorIcon, UserIcon, WrenchIcon } from "./icons";

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", Icon: HomeIcon },
  { href: "/alertes", label: "Alertes", Icon: BellIcon },
  { href: "/appareils", label: "Appareils", Icon: MonitorIcon },
  { href: "/interventions", label: "Interventions", Icon: WrenchIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ criticalCount = 0 }: { criticalCount?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-xl">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon />
                <span>{label}</span>
                {href === "/alertes" && criticalCount > 0 && (
                  <span
                    className="absolute top-1.5 left-1/2 ml-2 min-w-5 rounded-full bg-critical px-1 text-center text-[10px] leading-5 font-bold text-white"
                    aria-label={`${criticalCount} alertes critiques`}
                  >
                    {criticalCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
