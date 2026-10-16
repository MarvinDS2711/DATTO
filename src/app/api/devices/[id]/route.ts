import { errorResponse, json, notFound } from "@/lib/api/respond";
import { getDattoProvider } from "@/lib/datto";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const provider = getDattoProvider();
    const device = await provider.getDevice((await params).id);
    return device ? json(device, provider.source) : notFound("Appareil");
  } catch (error) {
    return errorResponse(error);
  }
}
