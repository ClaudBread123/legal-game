export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || ""
    const allowedOrigins = [
      "https://claudbread123.github.io",
      "http://localhost:5173",
      "http://localhost:4173"
    ]
    const corsOrigin = allowedOrigins.includes(origin)
      ? origin
      : "https://claudbread123.github.io"

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response("Invalid JSON", { status: 400 })
    }

    const { system, userMessage, maxTokens = 1000 } = body

    if (!system || !userMessage) {
      return new Response("Missing required fields", { status: 400 })
    }

    try {
      const response = await fetch(
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

      if (!response.ok) {
        const err = await response.text()
        return new Response(
          JSON.stringify({ error: "Anthropic API error", details: err }),
          {
            status: response.status,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": corsOrigin,
            },
          }
        )
      }

      const data = await response.json()
      const text = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("")

      return new Response(JSON.stringify({ text }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
        },
      })
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Worker error", message: err.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
          },
        }
      )
    }
  },
}
