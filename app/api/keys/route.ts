import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import {
  generateApiKey,
  hashApiKey,
  type ApiKeyData,
} from "@/lib/api-key-auth"
import { corsHeaders } from "@/lib/cors"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/keys
 * Creates a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name = "API Key", environment = "live" } = body

    if (environment !== "live" && environment !== "test") {
      return NextResponse.json(
        { error: "Environment must be 'live' or 'test'" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Generate API key
    const apiKey = generateApiKey(environment)
    const keyHash = hashApiKey(apiKey)
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const keyData: ApiKeyData = {
      keyId,
      name,
      environment,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
    }

    // Store key metadata (hash as key) - 1 year TTL
    await kv.set(`api_key:${keyHash}`, keyData, { ex: 31536000 })

    // Store key metadata by keyId for listing/revocation
    await kv.set(`key_meta:${keyId}`, keyData, { ex: 31536000 })

    // Store keyId in list for enumeration (optional, for listing all keys)
    await kv.sadd("api_keys:all", keyId)

    return NextResponse.json(
      {
        apiKey, // Only return plain key once!
        keyId,
        name,
        createdAt: keyData.createdAt,
        environment,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * GET /api/keys
 * Lists all API keys (metadata only, no actual keys)
 * Note: Without user auth, this lists all keys. In production, add user auth.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all key IDs
    const keyIds = (await kv.smembers("api_keys:all")) as string[]

    if (!keyIds || keyIds.length === 0) {
      return NextResponse.json({ keys: [] }, { headers: corsHeaders })
    }

    // Get metadata for each key (without the actual key)
    const keys = await Promise.all(
      keyIds.map(async (keyId) => {
        const keyData = await kv.get<ApiKeyData>(`key_meta:${keyId}`)
        if (!keyData) return null

        return {
          keyId,
          name: keyData.name,
          environment: keyData.environment,
          createdAt: keyData.createdAt,
          lastUsed: keyData.lastUsed,
          usageCount: keyData.usageCount,
        }
      })
    )

    // Filter out nulls (deleted keys)
    const validKeys = keys.filter((k) => k !== null)

    return NextResponse.json({ keys: validKeys }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error listing API keys:", error)
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500, headers: corsHeaders }
    )
  }
}

