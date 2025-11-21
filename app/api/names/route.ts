import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import { validateApiKey } from "@/lib/api-key-auth"
import { corsHeaders } from "@/lib/cors"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    const apiKey = request.headers.get("x-api-key")

    // Validate API key if provided
    if (apiKey) {
      const keyValidation = await validateApiKey(apiKey)
      if (!keyValidation.valid) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: corsHeaders }
        )
      }
    }

    if (!sessionId) {
      return NextResponse.json({ value: null }, { status: 200, headers: corsHeaders })
    }

    const key = `names:${sessionId}`
    const value = await kv.get(key)
    
    return NextResponse.json({ value: value || null }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error fetching names:", error)
    return NextResponse.json(
      { error: "Failed to fetch names" },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    const apiKey = request.headers.get("x-api-key")

    // Validate API key if provided
    if (apiKey) {
      const keyValidation = await validateApiKey(apiKey)
      if (!keyValidation.valid) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: corsHeaders }
        )
      }
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400, headers: corsHeaders }
      )
    }

    const { value } = await request.json()
    const key = `names:${sessionId}`
    
    await kv.set(key, value)
    
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error saving names:", error)
    return NextResponse.json(
      { error: "Failed to save names" },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    const apiKey = request.headers.get("x-api-key")

    // Validate API key if provided
    if (apiKey) {
      const keyValidation = await validateApiKey(apiKey)
      if (!keyValidation.valid) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: corsHeaders }
        )
      }
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400, headers: corsHeaders }
      )
    }

    const key = `names:${sessionId}`
    await kv.del(key)
    
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error deleting names:", error)
    return NextResponse.json(
      { error: "Failed to delete names" },
      { status: 500, headers: corsHeaders }
    )
  }
}

