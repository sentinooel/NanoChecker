import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Call the Roblox API with better error handling
    const response = await fetch(
      `https://auth.roblox.com/v1/usernames/validate?username=${encodeURIComponent(username)}&birthday=2001-09-11`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
    )

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json({
        username,
        available: false,
        message: "Rate limited - please slow down",
        code: 429,
        rateLimited: true,
      })
    }

    // Handle other non-200 responses
    if (!response.ok) {
      return NextResponse.json({
        username,
        available: false,
        message: `API Error: ${response.status}`,
        code: response.status,
      })
    }

    // Try to parse JSON response
    const text = await response.text()
    let data

    try {
      data = JSON.parse(text)
    } catch (parseError) {
      // If response isn't JSON, it might be an error message
      console.error("Failed to parse JSON:", text)
      return NextResponse.json({
        username,
        available: false,
        message: "Invalid API response",
        code: 500,
      })
    }

    return NextResponse.json({
      username,
      available: data.code === 0,
      message: data.message || (data.code === 0 ? "Username is available" : "Username is taken"),
      code: data.code,
    })
  } catch (error) {
    console.error("Error checking username:", error)
    return NextResponse.json(
      {
        username: "",
        available: false,
        message: "Network error occurred",
        code: 500,
      },
      { status: 500 },
    )
  }
}
