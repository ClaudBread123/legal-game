const COLOR_MAP = {
  critical: 'var(--accent-red)',
  major: 'var(--accent-yellow)',
  minor: 'var(--accent-blue)',
  active: 'var(--accent-green)',
  complete: 'var(--accent-green)',
  warning: 'var(--accent-yellow)',
  info: 'var(--accent-blue)',
  muted: 'var(--text-muted)',
}

export default function StatusDot({ status = 'info', size = 8 }) {
  const color = COLOR_MAP[status] || 'var(--text-muted)'
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  )
}
