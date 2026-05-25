export async function withConfidenceRetry(apiFn, args, maxRetries = 3) {
  let attempts = 0
  let lastResult = null

  while (attempts < maxRetries) {
    attempts++

    try {
      const result = await apiFn(args)

      // No confidence score — treat as MEDIUM (accept immediately)
      if (!result || !result.confidenceScore) {
        return result
      }

      if (result.confidenceScore === 'HIGH') {
        return result
      }

      if (result.confidenceScore === 'MEDIUM' && attempts >= 2) {
        // Accept MEDIUM after two attempts
        return result
      }

      // LOW confidence or first-attempt MEDIUM — retry silently
      lastResult = result
      console.warn(`Confidence ${result.confidenceScore} on attempt ${attempts}, retrying...`)

      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      if (attempts >= maxRetries) throw err
    }
  }

  // Exhausted retries — return best available result
  return lastResult
}
