import "server-only";
import { NextResponse } from "next/server";
import { DattoNotImplementedError, DattoTimeoutError } from "@/lib/datto/errors";

/** Réponse JSON incluant toujours la source des données (mock / datto). */
export function json<T>(data: T, source: string, init?: ResponseInit) {
  return NextResponse.json({ source, data }, init);
}

/** Convertit une erreur en réponse HTTP sans divulguer de détail interne. */
export function errorResponse(error: unknown) {
  if (error instanceof DattoNotImplementedError) {
    return NextResponse.json({ error: error.message }, { status: 501 });
  }
  if (error instanceof DattoTimeoutError) {
    return NextResponse.json({ error: "Datto RMM ne répond pas (délai dépassé)." }, { status: 504 });
  }
  console.error("Erreur API interne", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
}

export function notFound(what: string) {
  return NextResponse.json({ error: `${what} introuvable.` }, { status: 404 });
}
