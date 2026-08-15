import { ImageResponse } from "next/og";
export const alt = "Kraviona — Blockchain and Web3 intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 82px",
        background: "linear-gradient(135deg, #050816 0%, #101936 62%, #22134f 100%)",
        color: "#ffffff",
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 42, fontWeight: 700 }}>
        kraviona<span style={{ color: "#55e6ff" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 86,
          lineHeight: 0.98,
          maxWidth: 900,
          letterSpacing: "-4px",
        }}
      >
        <span>Signal for the</span>
        <span>on-chain world.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#aebbd8",
        }}
      >
        <span>BLOCKCHAIN · WEB3 · DEFI · SECURITY</span>
        <span>kraviona.site</span>
      </div>
    </div>,
    size,
  );
}
