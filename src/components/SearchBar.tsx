import { SearchIcon } from "./icons";

/** Formulaire GET : fonctionne sans JavaScript côté client. */
export function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/recherche" method="get" role="search" className="px-4">
      <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
        <SearchIcon className="shrink-0 text-muted" />
        <span className="sr-only">Rechercher un client, un site ou une machine</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          placeholder="Client, site ou machine…"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="off"
          className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
      </label>
    </form>
  );
}
