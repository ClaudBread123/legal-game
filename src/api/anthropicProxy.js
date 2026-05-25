const FALLBACK_URL = 'https://llw-api-proxy.ollopiz.workers.dev'
const _envUrl = import.meta.env.VITE_API_PROXY_URL
const PROXY_URL = (_envUrl && _envUrl !== 'PLACEHOLDER' && !_envUrl.includes('your-worker'))
  ? _envUrl
  : FALLBACK_URL

export async function testApiConnection() {
  const _e = import.meta.env.VITE_API_PROXY_URL
  const proxyUrl = (_e && _e !== 'PLACEHOLDER' && !_e.includes('your-worker'))
    ? _e
    : FALLBACK_URL

  console.log('API Test — Proxy URL:', proxyUrl)

  try {
    const response = await fetch(proxyUrl, { method: 'GET' })

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
  return !!PROXY_URL
}

export async function callClaude({ system, userMessage, maxTokens = 1000 }) {
  console.log('callClaude: using proxy URL:', PROXY_URL)

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
