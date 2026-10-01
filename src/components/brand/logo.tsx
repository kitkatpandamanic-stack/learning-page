import * as React from "react";
import { cn } from "cn";

/** The PandaDev mark: a panda head with neon ears and glowing cyan eyes. */
function LogoMark({ className, ...props }: React.ComponentProps<"svg">) {
  const id = React.useId();
  const ears = `${id}-ears`;
  const glow = `${id}-glow`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className={cn("size-9", className)}
      {...props}
    >
      <defs>
        <linearGradient id={ears} x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ears */}
      <circle cx="10" cy="11" r="6.5" fill={`url(#${ears})`} />
      <circle cx="30" cy="11" r="6.5" fill={`url(#${ears})`} />

      {/* Face */}
      <ellipse cx="20" cy="22.5" rx="14" ry="13" fill="#f5f3ff" />

      {/* Eye patches */}
      <ellipse
        cx="14"
        cy="21.5"
        rx="4"
        ry="5"
        transform="rotate(-28 14 21.5)"
        fill="#1a1640"
      />
      <ellipse
        cx="26"
        cy="21.5"
        rx="4"
        ry="5"
        transform="rotate(28 26 21.5)"
        fill="#1a1640"
      />

      {/* Glowing eyes */}
      <g filter={`url(#${glow})`}>
        <circle cx="14.6" cy="21" r="1.6" fill="#22d3ee" />
        <circle cx="25.4" cy="21" r="1.6" fill="#22d3ee" />
      </g>

      {/* Nose */}
      <ellipse cx="20" cy="28" rx="2.2" ry="1.5" fill="#1a1640" />
    </svg>
  );
}

function Logo({
  className,
  markClassName,
  ...props
}: React.ComponentProps<"span"> & { markClassName?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <LogoMark
        className={cn(
          "drop-shadow-[0_0_10px_rgb(139_92_246/0.6)]",
          markClassName,
        )}
      />
      <span className="text-xl font-bold tracking-tight text-white">
        Panda<span className="text-gradient">Dev</span>
      </span>
    </span>
  );
}

export { Logo, LogoMark };
