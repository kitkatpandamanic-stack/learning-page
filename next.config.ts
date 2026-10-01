import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {};

export default async function config(phase: string): Promise<NextConfig> {
  // In dev, run Velite in watch mode alongside Next so content edits show up live.
  // Production builds run `velite build` first via the npm "build" script.
  if (phase === PHASE_DEVELOPMENT_SERVER && !process.env.VELITE_STARTED) {
    process.env.VELITE_STARTED = "1";
    const { build } = await import("velite");
    await build({ watch: true, clean: false });
  }
  return nextConfig;
}
