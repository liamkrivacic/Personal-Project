import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#030405",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#ffd166",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          LK
        </div>
      </div>
    ),
    { ...size },
  );
}
