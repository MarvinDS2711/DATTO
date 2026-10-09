import { errorResponse, json, notFound } from "@/lib/api/respond";
import { getDattoProvider } from "@/lib/datto";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const provider = getDattoProvider();
    const alert = await provider.getAlert((await params).id);
    return alert ? json(alert, provider.source) : notFound("Alerte");
  } catch (error) {
    return errorResponse(error);
  }
}
