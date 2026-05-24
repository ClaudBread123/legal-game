export default function ActionButton({ onClick, disabled, children, variant = 'primary', fullWidth = false, style = {} }) {
  const variants = {
    primary: {
      background: 'var(--accent-gold)',
      color: '#0f1117',
      border: 'none',
      fontFamily: 'var(--font-serif)',
      fontWeight: 600,
    },
    secondary: {
      background: 'var(--bg-card)',
      color: 'var(--accent-gold)',
      border: '1px solid var(--accent-gold)',
      fontFamily: 'var(--font-sans)',
    },
    ghost: {
      background: 'none',
      color: 'var(--accent-blue)',
      border: 'none',
      fontFamily: 'var(--font-sans)',
    },
    danger: {
      background: 'none',
      color: 'var(--accent-red)',
      border: '1px solid var(--accent-red)',
      fontFamily: 'var(--font-sans)',
    },
  }
  const v = variants[variant] || variants.primary
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        fontSize: '14px',
        padding: '10px 18px',
        borderRadius: '6px',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 150ms ease',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
