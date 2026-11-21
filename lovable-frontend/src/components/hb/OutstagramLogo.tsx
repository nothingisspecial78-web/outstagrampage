import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: "badge" | "glyph";
}

/**
 * OutstagramIcon — The official emblem of Outstagram.
 * Combines an outdoor compass pointing outward, a camera viewfinder,
 * mountain peaks, and sunrise in warm terracotta and ink.
 */
export function OutstagramIcon({
  className,
  size = 28,
  variant = "badge",
}: LogoProps) {
  if (variant === "glyph") {
    return (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
        className={cn("shrink-0", className)}
        aria-label="Outstagram icon"
      >
        {/* Viewfinder brackets */}
        <path d="M5 10V6C5 5.44772 5.44772 5 6 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M31 10V6C31 5.44772 30.5523 5 30 5H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 26V30C5 30.5523 5.44772 31 6 31H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M31 26V30C31 30.5523 30.5523 31 30 31H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

        {/* Outer compass rim */}
        <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2" />

        {/* Sun rays & sunrise */}
        <path d="M18 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 12L22.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 18C13 15.2386 15.2386 13 18 13C20.7614 13 23 15.2386 23 18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Mountain peak */}
        <path d="M10 24L14 18L18 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 24L20 19L26 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Compass needle pointing North-East */}
        <polygon points="18,18 24,11 19,16" fill="currentColor" />
        <polygon points="18,18 12,25 17,20" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="18" r="1.5" fill="var(--color-paper-raised, #FAF7F2)" stroke="currentColor" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative grid place-items-center rounded-[22%] bg-stamp text-paper-raised shadow-sm shrink-0 overflow-hidden select-none",
        className
      )}
      aria-label="Outstagram badge"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%]"
      >
        {/* Subtle inner card border */}
        <rect x="2" y="2" width="44" height="44" rx="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* Camera Viewfinder Corners */}
        <path d="M8 15V10C8 8.89543 8.89543 8 10 8H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 15V10C40 8.89543 39.1046 8 38 8H33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 33V38C8 39.1046 8.89543 40 10 40H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 33V38C40 39.1046 39.1046 40 38 40H33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

        {/* Central Dial Ring */}
        <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="2.5" />

        {/* Cardinal Tick marks */}
        <line x1="24" y1="11" x2="24" y2="13.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="34.5" x2="24" y2="37" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="24" x2="13.5" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="34.5" y1="24" x2="37" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />

        {/* Rising Sun */}
        <path d="M17 24C17 20.134 20.134 17 24 17C27.866 17 31 20.134 31 24" fill="#E88B68" opacity="0.75" />
        <line x1="24" y1="15" x2="24" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="17.5" x2="19.5" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="17.5" x2="28.5" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Mountains / Trails */}
        <polygon points="12,32 18,24 24,32" fill="#1C1917" />
        <polygon points="20,32 27,22 36,32" fill="#292524" />

        {/* Compass Needle pointing North-East */}
        <polygon points="24,24 33,13 26,21" fill="white" />
        <polygon points="24,24 15,35 22,27" fill="#1C1917" />

        {/* Center Pivot Pin */}
        <circle cx="24" cy="24" r="2.5" fill="#FAF7F2" stroke="#C85A32" strokeWidth="1.5" />
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
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
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
