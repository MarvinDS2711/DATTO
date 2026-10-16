import { renderAppIcon } from "@/lib/pwa/icon-image";

export const dynamic = "force-static";

export function GET() {
  return renderAppIcon(192);
}
