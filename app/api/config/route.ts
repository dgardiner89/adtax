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

    let keyId: string | undefined

    // Validate API key if provided
    if (apiKey) {
      const keyValidation = await validateApiKey(apiKey)
      if (!keyValidation.valid) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401, headers: corsHeaders }
        )
      }
      keyId = keyValidation.keyId
    }

    // If API key provided, try to get key-linked config first
    if (keyId) {
      const keyConfig = await kv.get(`config:api_key:${keyId}`)
      if (keyConfig) {
        return NextResponse.json({ value: keyConfig }, { headers: corsHeaders })
      }
    }

    // Fall back to session-based config
    if (!sessionId) {
      return NextResponse.json({ value: null }, { status: 200, headers: corsHeaders })
    }

    const key = `config:${sessionId}`
    const value = await kv.get(key)
    
    return NextResponse.json({ value: value || null }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json(
      { error: "Failed to fetch config" },
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
    const key = `config:${sessionId}`
    
    await kv.set(key, value)
    
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error saving config:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save config"
    return NextResponse.json(
      { error: errorMessage },
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

    const key = `config:${sessionId}`
    await kv.del(key)
    
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error deleting config:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete config"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    )
  }
}

