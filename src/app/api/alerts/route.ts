import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, json } from "@/lib/api/respond";
import { ALERT_PRIORITIES, getDattoProvider } from "@/lib/datto";

const querySchema = z.object({
  priority: z.enum(ALERT_PRIORITIES).optional(),
  clientId: z.string().max(64).optional(),
  deviceUid: z.string().max(64).optional(),
  includeResolved: z.enum(["true", "false"]).optional(),
});

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!query.success) return NextResponse.json({ error: "Filtres invalides." }, { status: 400 });
  try {
    const provider = getDattoProvider();
    const { includeResolved, ...rest } = query.data;
    return json(await provider.listAlerts({ ...rest, includeResolved: includeResolved === "true" }), provider.source);
  } catch (error) {
    return errorResponse(error);
  }
}
