import { errorResponse, json } from "@/lib/api/respond";
import { getDattoProvider } from "@/lib/datto";

export async function GET() {
  try {
    const provider = getDattoProvider();
    return json(await provider.getDashboardSummary(), provider.source);
  } catch (error) {
    return errorResponse(error);
  }
}
