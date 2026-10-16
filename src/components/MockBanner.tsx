export function MockBanner() {
  return (
    <div
      role="note"
      className="pt-safe sticky top-0 z-50 bg-moderate px-4 py-1 text-center text-xs font-semibold text-black"
    >
      MAQUETTE — données fictives, Datto non connecté
    </div>
  );
}

export function LiveBanner() {
  return (
    <div role="note" className="pt-safe sticky top-0 z-50 bg-accent px-4 py-1 text-center text-xs font-semibold text-white">
      Datto RMM — données réelles, lecture seule
    </div>
  );
}
