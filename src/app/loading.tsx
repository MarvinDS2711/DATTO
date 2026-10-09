export default function Loading() {
  return (
    <div className="space-y-3 px-4 pt-6" aria-busy="true" aria-label="Chargement">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}
