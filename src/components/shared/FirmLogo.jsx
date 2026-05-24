const SIZES = {
  sm: { text: '14px', icon: 20, gap: 8 },
  md: { text: '20px', icon: 32, gap: 10 },
  lg: { text: '32px', icon: 48, gap: 14 },
}

export default function FirmLogo({ size = 'md' }) {
  const s = SIZES[size] || SIZES.md
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base */}
        <line x1="24" y1="44" x2="24" y2="8" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="44" x2="36" y2="44" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
        {/* Crossbar */}
        <line x1="8" y1="16" x2="40" y2="16" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left pan chain */}
        <line x1="12" y1="16" x2="8" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="16" x2="4" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left pan */}
        <path d="M3 28 Q8 32 13 28" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Right pan chain */}
        <line x1="36" y1="16" x2="40" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="40" y1="16" x2="44" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right pan */}
        <path d="M35 28 Q40 32 45 28" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Top ornament */}
        <circle cx="24" cy="8" r="2.5" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
      </svg>
      <span
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: s.text,
          color: 'var(--accent-gold)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        LLOPIZ WIZEL LLP
      </span>
    </div>
  )
}
