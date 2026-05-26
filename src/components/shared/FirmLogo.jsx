const SIZES = {
  sm: { icon: 16, text: 13, gap: 6 },
  md: { icon: 24, text: 18, gap: 8 },
  lg: { icon: 40, text: 28, gap: 12 },
}

export default function FirmLogo({ size = 'md' }) {
  const s = SIZES[size] || SIZES.md

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${s.gap}px`,
    }}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <line x1="12" y1="3" x2="12" y2="21" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="6" x2="20" y2="6" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="6" x2="4" y2="11" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="6" x2="20" y2="11" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M1 11 Q4 14 7 11" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M17 11 Q20 14 23 11" stroke="#c9a84c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="15" y2="21" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>

      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: `${s.text}px`,
        fontWeight: 700,
        color: 'var(--accent-gold)',
        letterSpacing: '0.05em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        LLOPIZ WIZEL LLP
      </span>
    </div>
  )
}
