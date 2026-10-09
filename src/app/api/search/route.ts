import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api/respond";
import { getDattoProvider } from "@/lib/datto";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  try {
    const provider = getDattoProvider();
    return json(await provider.search(q), provider.source);
  } catch (error) {
    return errorResponse(error);
  }
}
