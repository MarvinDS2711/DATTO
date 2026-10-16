import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Introuvable" />
      <p className="px-4 text-muted">Cet élément n&apos;existe pas ou n&apos;est pas accessible.</p>
      <Link href="/" className="mx-4 mt-6 inline-block rounded-xl bg-accent px-4 py-3 font-semibold text-white">
        Retour à l&apos;accueil
      </Link>
    </>
  );
}
