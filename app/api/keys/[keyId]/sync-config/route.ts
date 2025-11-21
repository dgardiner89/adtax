import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import type { ApiKeyData } from "@/lib/api-key-auth"
import type { Config } from "@/lib/types"
import { corsHeaders } from "@/lib/cors"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/keys/:keyId/sync-config
 * Syncs the current session's config to an API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const { keyId } = params
    const sessionId = request.headers.get("x-session-id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify key exists
    const keyData = await kv.get<ApiKeyData>(`key_meta:${keyId}`)
    if (!keyData) {
      return NextResponse.json(
        { error: "Key not found" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get current session's config
    const sessionConfig = await kv.get<Config>(`config:${sessionId}`)
    if (!sessionConfig) {
      return NextResponse.json(
        { error: "No configuration found for current session" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Store config linked to API key
    await kv.set(`config:api_key:${keyId}`, sessionConfig)

    return NextResponse.json(
      { success: true, message: "Configuration synced to API key" },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("Error syncing config to API key:", error)
    return NextResponse.json(
      { error: "Failed to sync configuration" },
      { status: 500, headers: corsHeaders }
    )
  }
}

