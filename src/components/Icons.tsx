// Custom SVG icons — no standard emojis anywhere

export function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      {/* Hook */}
      <path
        d="M28 6v18c0 5.5-4.5 10-10 10s-10-4.5-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 6l-4-3M28 6l4-3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Fish silhouette */}
      <path
        d="M30 28c3-2 8-3 14-1-2-3-5-5-9-5 1-2 1.5-4.5 1-7-3 2-5.5 4.5-6 7.5"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Fish eye */}
      <circle cx="38" cy="23" r="1.2" fill="currentColor" opacity="0.3" />
      {/* Wave */}
      <path
        d="M4 40c4-3 8-3 12 0s8 3 12 0 8-3 12 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

export function IconFish({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12c3-4 8-6 14-4-1-3-3-5-6-6 1 2 1 4 0 6-4 0-7 2-8 4zm14-4c0 .8-.5 1.5-1 1.5s-1-.7-1-1.5.5-1.5 1-1.5 1 .7 1 1.5z" fill="currentColor"/>
      <path d="M20 8c2 2 2 4 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconTemp({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="18" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="18" r="2" fill="currentColor"/>
      <path d="M12 10h3M12 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconWave({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 8c3-3 5-3 8 0s5 3 8 0 5-3 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 14c3-3 5-3 8 0s5 3 8 0 5-3 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function IconWind({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 8h12a3 3 0 100-3M3 12h16a3 3 0 110 3M3 16h10a3 3 0 100 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPressure({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 12l4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMoon({ phase, className = "w-4 h-4" }: { phase?: string; className?: string }) {
  // Simple crescent that adjusts
  const illum = phase?.includes('full') ? 1 : phase?.includes('new') ? 0 : phase?.includes('first') || phase?.includes('last') ? 0.5 : 0.3;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path
        d={illum >= 0.9
          ? "M12 3a9 9 0 010 18 9 9 0 010-18z"
          : `M12 3a9 9 0 010 18 ${7 - illum * 8} ${7 - illum * 8} 0 010-18z`}
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

export function IconHook({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2v10c0 4-3 7-6 7s-4-2-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 2l-3-0M12 2l3 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
    </svg>
  );
}

export function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconCalendar({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3"/>
      <rect x="14" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}

export function IconCamera({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 6l1-3h6l1 3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function IconPin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="9" r="2.5" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

export function IconChevron({ className = "w-4 h-4", up = false }: { className?: string; up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} transition-transform ${up ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
