"use client";

import dynamic from "next/dynamic";

/** CSS-only orb shown while the 3D scene loads (and if WebGL is unavailable). */
function OrbFallback() {
  return (
    <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#c4b5fd_0%,#8b5cf6_30%,#22d3ee_65%,transparent_72%)] opacity-60 blur-md motion-safe:animate-pulse" />
  );
}

const OrbScene = dynamic(() => import("./orb-scene"), {
  ssr: false,
  loading: OrbFallback,
});

export function Orb() {
  return (
    <div aria-hidden className="relative aspect-square w-full">
      {/* Soft glow behind the canvas */}
      <div className="absolute inset-[12%] rounded-full bg-neon-violet/40 blur-[80px]" />
      <div className="absolute inset-[30%] translate-x-[15%] translate-y-[20%] rounded-full bg-neon-cyan/30 blur-[70px]" />
      <div className="absolute inset-0">
        <OrbScene />
      </div>
    </div>
  );
}
