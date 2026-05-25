const PROXY_URL = import.meta.env.VITE_API_PROXY_URL

export async function testApiConnection() {
  console.log('API Test — Proxy URL:', PROXY_URL)

  if (!PROXY_URL ||
      PROXY_URL === 'PLACEHOLDER' ||
      PROXY_URL === 'https://placeholder.example.com') {
    return {
      success: false,
      reason: 'NO_PROXY_URL',
      message: 'VITE_API_PROXY_URL not configured'
    }
  }

  try {
    const response = await fetch(PROXY_URL, { method: 'GET' })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        hasApiKey: data.hasApiKey,
        workerRunning: true,
        message: data.hasApiKey
          ? 'API fully operational'
          : 'Worker running but API key missing'
      }
    }

    return {
      success: false,
      reason: 'WORKER_ERROR',
      status: response.status,
      message: `Worker returned ${response.status}`
    }
  } catch (err) {
    return {
      success: false,
      reason: 'CONNECTION_FAILED',
      message: err.message
    }
  }
}

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
