import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api/respond";
import { getDattoProvider } from "@/lib/datto";

export async function GET(request: NextRequest) {
  const siteUid = request.nextUrl.searchParams.get("siteUid") ?? undefined;
  const clientId = request.nextUrl.searchParams.get("clientId") ?? undefined;
  try {
    const provider = getDattoProvider();
    return json(await provider.listDevices({ siteUid, clientId }), provider.source);
  } catch (error) {
    return errorResponse(error);
  }
}
