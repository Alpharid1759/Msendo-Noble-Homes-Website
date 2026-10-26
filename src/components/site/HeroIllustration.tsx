// src/components/site/HeroIllustration.tsx
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 520" aria-hidden="true" className={className} preserveAspectRatio="xMidYMax meet">
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#c2a46d" strokeOpacity="0.08" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="900" height="520" fill="url(#grid)" />
      <g fill="none" stroke="#c2a46d" strokeWidth="1.25" strokeLinejoin="miter">
        <path d="M40 470 H880" strokeWidth="1.5" />

        <path d="M70 470 V300 H250 V470" />
        <path d="M60 300 L160 236 L260 300" />
        <path d="M100 470 V390 H150 V470 M180 330 H230 V380 H180 Z M95 330 H140 V365 H95 Z" />
        <path d="M250 470 V340 H360 V470 M270 360 H340 V420 H270 Z M245 340 H365" />

        <path d="M400 470 V120 H600 V470" strokeWidth="1.5" />
        <path d="M390 120 H610 M420 100 H580 V120" />
        {Array.from({ length: 6 }).flatMap((_, row) =>
          Array.from({ length: 4 }).map((__, col) => (
            <rect key={`w-${row}-${col}`} x={420 + col * 44} y={140 + row * 48} width="28" height="30" />
          )),
        )}
        <path d="M470 470 V430 H530 V470 M460 430 H540" />

        <path d="M640 470 V250 L720 205 L800 250 V470" />
        <path d="M660 280 H700 V320 H660 Z M740 280 H780 V320 H740 Z M660 350 H700 V390 H660 Z M740 350 H780 V390 H740 Z M700 470 V420 H740 V470" />
        <path d="M800 470 V330 H860 V470 M815 350 H845 V380 H815 Z" />
      </g>
      <g fill="none" stroke="#c2a46d" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 5">
        <path d="M400 490 H600 M400 482 V498 M600 482 V498" />
        <path d="M620 120 V470 M612 120 H628 M612 470 H628" />
        <path d="M70 490 H360 M70 482 V498 M360 482 V498" />
      </g>
      <g fill="#c2a46d" fillOpacity="0.7" fontFamily="ui-monospace, monospace" fontSize="11">
        <text x="482" y="512">20.0 m</text>
        <text x="632" y="300" transform="rotate(90 632 300)">
          35.0 m
        </text>
        <text x="196" y="512">29.0 m</text>
      </g>
    </svg>
  );
}
