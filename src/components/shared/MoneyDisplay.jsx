export default function MoneyDisplay({ amount, size = '14px', showCents = false }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount)
  return (
    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', fontSize: size }}>
      {formatted}
    </span>
  )
}
