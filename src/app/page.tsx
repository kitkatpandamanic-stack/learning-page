import { Button } from "@/components/ui/button";

// Temporary placeholder until the landing page is built in Phase 2.
export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#070814] px-4 text-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-violet-600/40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-10 size-[28rem] rounded-full bg-cyan-400/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 bottom-10 size-[24rem] rounded-full bg-pink-500/25 blur-[120px]" />

      <div className="relative rounded-3xl border border-white/15 bg-white/5 px-8 py-12 shadow-[0_0_60px_-15px_rgba(139,92,246,0.6)] backdrop-blur-xl sm:px-14">
        <p className="mb-4 font-mono text-sm text-cyan-300">
          {"// coming soon"}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Panda
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
            Dev
          </span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/70">
          Learn programming languages from Zero to Senior.
        </p>
        <Button className="mt-8 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-6 text-white hover:opacity-90">
          Start learning
        </Button>
      </div>
    </main>
  );
}
