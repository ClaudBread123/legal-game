export function getSimulatedStartDate() {
  const today = new Date()
  // Go back at least 5 business days, landing on a Monday
  let d = new Date(today)
  let businessDaysBack = 0
  while (businessDaysBack < 5) {
    d.setDate(d.getDate() - 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) businessDaysBack++
  }
  // Now rewind to most recent Monday
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() - 1)
  }
  return d.toISOString().split('T')[0]
}

export function advanceBusinessDay(isoDate) {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d.toISOString().split('T')[0]
}

export function formatGameDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysBetween(isoDate1, isoDate2) {
  const d1 = new Date(isoDate1)
  const d2 = new Date(isoDate2)
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export function addBusinessDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00')
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

export function isAfterHB145(isoDate) {
  return isoDate >= '2026-10-01'
}
