// Fixed, decorative background: glowing colour blobs, twinkling stars, a faint
// grid and film grain. Rendered once in the root layout behind every page.

/** Small deterministic PRNG so the star field is identical on server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(2026);
const STARS = Array.from({ length: 70 }, () => ({
  top: random() * 100,
  left: random() * 100,
  size: random() < 0.85 ? 1 : 2,
  delay: random() * 4,
}));

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function SpaceBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-space-950"
    >
      {/* Colour blobs */}
      <div className="absolute -top-[20%] left-[15%] size-[42rem] rounded-full bg-neon-violet/45 blur-[140px] motion-safe:animate-blob" />
      <div className="absolute top-[30%] -right-[10%] size-[34rem] rounded-full bg-neon-pink/35 blur-[140px] [animation-delay:-7s] motion-safe:animate-blob" />
      <div className="absolute -bottom-[20%] -left-[10%] size-[36rem] rounded-full bg-neon-cyan/35 blur-[140px] [animation-delay:-14s] motion-safe:animate-blob" />

      {/* Faint grid that fades out towards the edges */}
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent)] bg-[size:64px_64px]" />

      {/* Stars */}
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white motion-safe:animate-twinkle"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
