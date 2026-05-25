const PROXY_URL = import.meta.env.VITE_API_PROXY_URL

export function isApiAvailable() {
  return !!(
    PROXY_URL &&
    PROXY_URL !== 'PLACEHOLDER' &&
    PROXY_URL !== 'https://placeholder.example.com'
  )
}

export async function callClaude({ system, userMessage, maxTokens = 1000 }) {
  console.log('callClaude: proxy URL =', PROXY_URL ? PROXY_URL.substring(0, 30) + '...' : 'NOT SET')

  if (!isApiAvailable()) {
    console.warn('callClaude: API unavailable — no proxy URL configured')
    throw new Error('API_UNAVAILABLE')
  }

  console.log('callClaude: making request...')

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, userMessage, maxTokens }),
    })

    if (!response.ok) {
      console.error('callClaude: HTTP error', response.status)
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      console.error('callClaude: API error', data.error)
      throw new Error(data.error)
    }

    console.log('callClaude: success, response length =', data.text?.length)
    return data.text
  } catch (err) {
    if (err.message === 'API_UNAVAILABLE') throw err
    console.error('callClaude: failed', err.message)
    throw new Error('API_UNAVAILABLE')
  }
}
