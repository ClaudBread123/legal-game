export async function callClaude({ system, userMessage, maxTokens = 1000 }) {
  const url = import.meta.env.VITE_API_PROXY_URL
  if (!url || url === 'PLACEHOLDER') {
    throw new Error('API_UNAVAILABLE')
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, userMessage, maxTokens }),
    })
    if (!res.ok) throw new Error('API_UNAVAILABLE')
    const data = await res.json()
    return data.text
  } catch {
    throw new Error('API_UNAVAILABLE')
  }
}
