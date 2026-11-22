import { useEffect, useState } from "react";
import { Wordmark } from "./AppShell";
import { OutstagramIcon } from "./OutstagramLogo";
import { cn } from "@/lib/utils";

export function Splash() {
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const close = () => { setLeaving(true); setTimeout(() => setShow(false), 450); try { sessionStorage.setItem("splash", "1"); } catch {} };
  useEffect(() => {
    if (sessionStorage.getItem("splash")) { setShow(false); return; }
    const t = setTimeout(close, 3800); return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <button onClick={close} aria-label="Continue" className={cn("fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper-raised transition-all duration-500", leaving && "scale-105 opacity-0 blur-sm")}>
      <style>{`
        @keyframes os-feed{0%{transform:translateY(0)}60%{transform:translateY(-55%)}100%{transform:translateY(-55%)}}
        @keyframes os-off{0%,55%{opacity:0}70%,100%{opacity:1}}
        @keyframes os-phone{0%,55%{transform:translateX(0) rotate(0);opacity:1}80%,100%{transform:translateX(-70px) rotate(-14deg);opacity:.35}}
        @keyframes os-walk{0%,60%{transform:translateX(0);opacity:0}68%{opacity:1}100%{transform:translateX(90px);opacity:1}}
        @keyframes os-sun{0%,55%{transform:scale(.3);opacity:0}85%,100%{transform:scale(1);opacity:1}}
        @keyframes os-step{0%,100%{transform:rotate(18deg)}50%{transform:rotate(-18deg)}}
        @media (prefers-reduced-motion: reduce){.os-a{animation:none!important}}
      `}</style>
      <div className="relative h-48 w-72">
        <div className="os-a absolute right-6 top-2 h-16 w-16 rounded-full bg-stamp/80 shadow-[0_0_40px] shadow-stamp/50" style={{ animation: "os-sun 3.2s ease-out forwards" }} />
        <div className="os-a absolute left-1/2 top-0 -ml-12 h-44 w-24 overflow-hidden rounded-[18px] border-4 border-ink bg-paper" style={{ animation: "os-phone 3.2s ease-in-out forwards" }}>
          <div className="os-a space-y-1.5 p-1.5" style={{ animation: "os-feed 2s ease-in forwards" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1"><div className="h-12 rounded bg-sand" /><div className="flex gap-1"><span className="text-[8px] text-badge">♥ {(i + 3) * 127}</span></div></div>
            ))}
          </div>
          <div className="os-a absolute inset-0 grid place-items-center bg-ink/90 text-[10px] font-semibold text-paper-raised" style={{ animation: "os-off 3.2s forwards" }}>screen off</div>
        </div>
        <svg viewBox="0 0 40 60" className="os-a absolute bottom-0 left-1/2 w-10 text-ink" style={{ animation: "os-walk 3.4s ease-out forwards" }}>
          <circle cx="20" cy="8" r="6" fill="currentColor" />
          <path d="M20 15v22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <g className="os-a" style={{ transformOrigin: "20px 37px", animation: "os-step .5s linear infinite" }}><path d="M20 37l-7 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></g>
          <g className="os-a" style={{ transformOrigin: "20px 37px", animation: "os-step .5s linear infinite reverse" }}><path d="M20 37l7 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></g>
          <path d="M20 20l-8 10M20 20l8 10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-line" />
      </div>
      <div className="animate-rise mt-8 flex flex-col items-center text-center [animation-delay:2.2s]">
        <OutstagramIcon size={52} className="mb-3 shadow-md" />
        <Wordmark className="text-4xl" />
        <p className="mt-3 max-w-xs px-6 text-sm text-ink-muted">Put the phone down. Go somewhere. Meet someone.</p>
      </div>
      <p className="animate-rise absolute bottom-10 text-xs font-medium text-ink-muted/70 [animation-delay:2.6s]">Tap to continue</p>
    </button>
  );
}
