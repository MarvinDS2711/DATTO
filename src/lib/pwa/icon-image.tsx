import { ImageResponse } from "next/og";

/** Icône PNG générée (écran d'accueil iOS / Android). */
export function renderAppIcon(size: number) {
  const stroke = Math.round(size * 0.08);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0f17" }}>
        <svg width={size} height={size} viewBox="0 0 64 64">
          <path
            d="M8 34h12l5-12 8 22 6-14 4 4h13"
            fill="none"
            stroke="#4f8cff"
            strokeWidth={(stroke / size) * 64}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
