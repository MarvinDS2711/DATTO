import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./icons";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</div>;
}

export function LinkCard({ href, children, accent }: { href: string; children: ReactNode; accent?: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 active:bg-surface-2 ${
        accent ? `border-l-4 ${accent}` : ""
      }`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRightIcon className="shrink-0 text-muted" />
    </Link>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-5 pb-2">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
