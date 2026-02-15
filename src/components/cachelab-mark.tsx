import * as React from "react";

import { cn } from "@/lib/utils";

type CacheLabMarkProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  title?: string;
};

export function CacheLabMark({ className, title = "CacheLab", ...props }: CacheLabMarkProps) {
  const id = React.useId();
  const bgId = `cl-bg-${id}`;
  const shineId = `cl-shine-${id}`;
  const glowId = `cl-glow-${id}`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      {...props}
    >
      <defs>
        <linearGradient id={bgId} x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--accent-cyan)" }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: "var(--accent-purple)" }} />
        </linearGradient>

        <linearGradient id={shineId} x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.55 0
            "
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#${bgId})`} />
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      <path
        d="M12 20 C18 14 24 10 32 10 C44 10 52 18 52 30"
        fill="none"
        stroke={`url(#${shineId})`}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.8"
      />

      <g filter={`url(#${glowId})`}>
        {/* C (cache ring) */}
        <path
          d="M36 22 A14 14 0 1 0 36 42"
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        {/* Arrow head (cache hint) */}
        <path d="M36 22 L44 20 L40 28 Z" fill="rgba(255,255,255,0.92)" />

        {/* L */}
        <path
          d="M41 20 V44 H52"
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Accent dot */}
        <circle cx="50" cy="22" r="2.6" fill="var(--accent-cyan)" opacity="0.95" />
      </g>
    </svg>
  );
}

