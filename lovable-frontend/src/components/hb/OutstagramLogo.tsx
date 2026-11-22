import { cn } from "@/lib/utils";
import { useState } from "react";

// 96x96 embedded high-fidelity brand emblem (Instant load, 0 network latency, 0 404 risk)
export const OUTSTAGRAM_ICON_DATA_URL =
  "data:image/jpeg;base64,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";

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: "badge" | "glyph";
}

/**
 * OutstagramIcon — The official brand emblem of Outstagram.
 * Features terracotta squircle, camera viewfinder brackets, compass needle pointing North-East,
 * mountain silhouettes, and golden sunrise.
 */
export function OutstagramIcon({
  className,
  size = 32,
  variant = "badge",
}: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const pxSize = typeof size === "number" ? `${size}px` : size;

  if (variant === "glyph") {
    return (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: pxSize, height: pxSize }}
        className={cn("shrink-0", className)}
        aria-label="Outstagram icon"
      >
        <path d="M5 10V6C5 5.44772 5.44772 5 6 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M31 10V6C31 5.44772 30.5523 5 30 5H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 26V30C5 30.5523 5.44772 31 6 31H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M31 26V30C31 30.5523 30.5523 31 30 31H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M18 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 12L22.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 24L14 18L18 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 24L20 19L26 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="18,18 24,11 19,16" fill="currentColor" />
        <polygon points="18,18 12,25 17,20" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="18" r="1.5" fill="var(--color-paper-raised, #FAF7F2)" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <div
      style={{ width: pxSize, height: pxSize }}
      className={cn(
        "relative grid place-items-center rounded-[22%] bg-stamp text-paper-raised shadow-xs shrink-0 overflow-hidden select-none ring-1 ring-black/5",
        className
      )}
      aria-label="Outstagram logo"
    >
      {!imgFailed ? (
        <img
          src={OUTSTAGRAM_ICON_DATA_URL}
          alt="Outstagram Emblem"
          style={{ width: "100%", height: "100%" }}
          className="size-full object-cover rounded-[22%] select-none"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[85%] h-[85%]"
        >
          <rect x="2" y="2" width="44" height="44" rx="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <path d="M8 15V10C8 8.89543 8.89543 8 10 8H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 15V10C40 8.89543 39.1046 8 38 8H33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 33V38C8 39.1046 8.89543 40 10 40H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 33V38C40 39.1046 39.1046 40 38 40H33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="2.5" />
          <line x1="24" y1="11" x2="24" y2="13.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="34.5" x2="24" y2="37" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="24" x2="13.5" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="34.5" y1="24" x2="37" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 24C17 20.134 20.134 17 24 17C27.866 17 31 20.134 31 24" fill="#E88B68" opacity="0.75" />
          <polygon points="12,32 18,24 24,32" fill="#1C1917" />
          <polygon points="20,32 27,22 36,32" fill="#292524" />
          <polygon points="24,24 33,13 26,21" fill="white" />
          <polygon points="24,24 15,35 22,27" fill="#1C1917" />
          <circle cx="24" cy="24" r="2.5" fill="#FAF7F2" stroke="#C85A32" strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
}

/**
 * OutstagramLogo — Complete brand lockup with Icon + Wordmark.
 */
export function OutstagramLogo({
  className,
  iconSize = 32,
  showTagline = false,
}: {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <OutstagramIcon size={iconSize} />
      <div className="flex flex-col">
        <span className="font-logo text-3xl leading-none text-ink tracking-tight">
          Outstagram
        </span>
        {showTagline && (
          <span className="font-hand text-xs text-ink-muted -mt-0.5">
            post less · go outside
          </span>
        )}
      </div>
    </div>
  );
}
