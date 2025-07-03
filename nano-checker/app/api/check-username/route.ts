import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get("username")

  if (!username) {
    return NextResponse.json({ error: "Username parameter is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://auth.roblox.com/v1/usernames/validate?username=${encodeURIComponent(username)}&birthday=2001-09-11`,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
    )

    // Always get the response text first
    const responseText = await response.text()

    // Handle rate limiting - check status AND content
    if (response.status === 429 || response.status === 503) {
      return NextResponse.json(
        {
          code: -1,
          message: "Rate limited by server",
          rateLimited: true,
        },
        { status: 429 },
      )
    }

    // Check if response contains rate limit indicators (HTML or text)
    if (
      responseText.includes("Too Many Requests") ||
      responseText.includes("Rate limit") ||
      responseText.includes("429") ||
      responseText.includes("fra1::") ||
      responseText.includes("sspf4-") ||
      responseText.includes("<html") ||
      responseText.includes("<!DOCTYPE")
    ) {
      console.log("Rate limit detected in response:", responseText.substring(0, 100))
      return NextResponse.json(
        {
          code: -1,
          message: "Rate limited by API",
          rateLimited: true,
        },
        { status: 429 },
      )
    }

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      return NextResponse.json(
        {
          code: -1,
          message: `HTTP error: ${response.status}`,
          error: true,
        },
        { status: response.status },
      )
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Response text:", responseText.substring(0, 200))

      return NextResponse.json(
        {
          code: -1,
          message: "Invalid response format",
          error: true,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error fetching from Roblox API:", error)
    return NextResponse.json(
      {
        code: -1,
        message: "Failed to validate username",
        error: true,
      },
      { status: 500 },
    )
  }
}
