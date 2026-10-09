"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 pt-8">
      <h1 className="text-2xl font-bold">Erreur</h1>
      <p className="mt-2 text-muted">
        Impossible de charger les données.{" "}
        {error.name === "DattoNotImplementedError" ? "Le connecteur Datto n'est pas encore implémenté." : ""}
      </p>
      {error.digest && <p className="mt-1 text-xs text-muted">Référence : {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-12 rounded-xl bg-accent px-5 font-semibold text-white active:opacity-80"
      >
        Réessayer
      </button>
    </div>
  );
}
