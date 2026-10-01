import { ImageResponse } from "next/og";

import { pandaDataUri } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f2350, #070814)",
      }}
    >
      <img src={pandaDataUri} width={132} height={132} alt="" />
    </div>,
    size,
  );
}
