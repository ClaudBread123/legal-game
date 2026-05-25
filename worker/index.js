export default {
  async fetch(request, env) {
    const allowedOrigins = [
      "https://claudbread123.github.io",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:3000"
    ]

    const origin = request.headers.get("Origin") || ""
    const corsOrigin = allowedOrigins.includes(origin)
      ? origin
      : "https://claudbread123.github.io"

    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      })
    }

    if (request.method === "GET") {
      const hasKey = !!env.ANTHROPIC_API_KEY
      return new Response(
        JSON.stringify({
          status: "Worker is running",
          hasApiKey: hasKey,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    }

    const { system, userMessage, maxTokens = 1000 } = body

    if (!system || !userMessage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: system, userMessage" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    }

    try {
      const anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: maxTokens,
            system: system,
            messages: [{ role: "user", content: userMessage }],
          }),
        }
      )

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text()
        return new Response(
          JSON.stringify({
            error: "Anthropic API error",
            status: anthropicResponse.status,
            details: errorText
          }),
          {
            status: anthropicResponse.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        )
      }

      const data = await anthropicResponse.json()
      const text = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("")

      return new Response(
        JSON.stringify({ text }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Worker error", message: err.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      )
    }
  },
}
