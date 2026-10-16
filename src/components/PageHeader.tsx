import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

export function PageHeader({ title, back, action }: { title: string; back?: string; action?: ReactNode }) {
  return (
    <header className="flex items-center gap-2 px-4 pt-4 pb-3">
      {back && (
        <Link href={back} aria-label="Retour" className="-ml-2 rounded-lg p-2 text-muted active:bg-surface-2">
          <ChevronLeftIcon />
        </Link>
      )}
      <h1 className="flex-1 truncate text-2xl font-bold tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
