import { ImageResponse } from "next/og";

export const alt = "Liam Krivacic Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#030405",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 50% at 50% 45%, rgba(255,209,102,0.13) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#fff3d5",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textTransform: "uppercase" as const,
            position: "relative",
          }}
        >
          LIAM KRIVACIC
        </div>
        <div
          style={{
            width: 72,
            height: 2,
            background: "#ffd166",
            margin: "28px 0",
            position: "relative",
          }}
        />
        <div
          style={{
            fontSize: 22,
            color: "#8997a0",
            letterSpacing: "0.06em",
            position: "relative",
          }}
        >
          Electrical Engineering + Computer Science · RF · Robotics · Software
        </div>
      </div>
    ),
    { ...size },
  );
}
