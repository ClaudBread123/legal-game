export function LoadingSpinner({ size = 24, color = 'var(--accent-gold)' }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid rgba(201, 168, 76, 0.2)`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto',
    }} />
  )
}
