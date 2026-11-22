import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: "badge" | "glyph";
}

/**
 * OutstagramIcon — The official brand emblem of Outstagram.
 *
 * Scalable vector SVG featuring:
 * - Terracotta squircle badge (#C85A32)
 * - Camera viewfinder corners
 * - Compass dial with cardinal marks
 * - Mountain silhouette & golden sunrise
 * - Compass needle pointing North-East
 * - Center pivot pin
 *
 * 100% Vector, 0 latency, 0 external network requests, razor-sharp on all screens.
 */
export function OutstagramIcon({
  className,
  size = 32,
  variant = "badge",
}: LogoProps) {
  const pxSize = typeof size === "number" ? `${size}px` : size;

  if (variant === "glyph") {
    return (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: pxSize, height: pxSize }}
        className={cn("shrink-0 select-none", className)}
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
        "relative grid place-items-center shrink-0 select-none rounded-[22%] overflow-hidden shadow-xs ring-1 ring-black/10 transition-transform",
        className
      )}
      aria-label="Outstagram logo"
    >
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full select-none"
      >
        {/* Terracotta squircle badge background */}
        <rect width="128" height="128" rx="28" fill="#C85A32" />

        {/* Subtle inner border */}
        <rect
          x="6"
          y="6"
          width="116"
          height="116"
          rx="22"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="2.5"
        />

        {/* Camera Viewfinder Corners */}
        <path
          d="M22 40V26C22 23.7909 23.7909 22 26 22H40"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M106 40V26C106 23.7909 104.209 22 102 22H88"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M22 88V102C22 104.209 23.7909 106 26 106H40"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M106 88V102C106 104.209 104.209 106 102 106H88"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Compass dial rim */}
        <circle cx="64" cy="64" r="36" stroke="white" strokeWidth="4.5" />

        {/* Cardinal Tick Marks */}
        <line x1="64" y1="30" x2="64" y2="36" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="64" y1="92" x2="64" y2="98" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="64" x2="36" y2="64" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="92" y1="64" x2="98" y2="64" stroke="white" strokeWidth="4" strokeLinecap="round" />

        {/* Rising Sun */}
        <path
          d="M46 64C46 54.0589 54.0589 46 64 46C73.9411 46 82 54.0589 82 64"
          fill="#E88B68"
          opacity="0.9"
        />
        <line x1="64" y1="41" x2="64" y2="45" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="49" y1="47.5" x2="52.5" y2="51" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="79" y1="47.5" x2="75.5" y2="51" stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* Mountain Peaks */}
        <polygon points="34,85 50,64 66,85" fill="#1C1917" />
        <polygon points="54,85 71,59 94,85" fill="#292524" />

        {/* Compass Needle pointing North-East */}
        <polygon points="64,64 88,36 69,56" fill="white" />
        <polygon points="64,64 40,92 59,72" fill="#1C1917" />

        {/* Center Pivot Pin */}
        <circle cx="64" cy="64" r="5.5" fill="#FAF7F2" stroke="#C85A32" strokeWidth="2.5" />
      </svg>
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
