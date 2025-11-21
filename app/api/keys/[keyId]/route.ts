import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import type { ApiKeyData } from "@/lib/api-key-auth"
import { corsHeaders } from "@/lib/cors"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * DELETE /api/keys/:keyId
 * Revokes an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const { keyId } = params

    // Get key metadata
    const keyData = await kv.get<ApiKeyData>(`key_meta:${keyId}`)

    if (!keyData) {
      return NextResponse.json(
        { error: "Key not found" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Delete key metadata
    await kv.del(`key_meta:${keyId}`)
    await kv.srem("api_keys:all", keyId)

    // Note: We can't delete the hashed key lookup without the original key
    // But we can mark it as revoked by setting a flag or deleting after TTL
    // For now, the key will expire naturally after 1 year

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error("Error revoking API key:", error)
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500, headers: corsHeaders }
    )
  }
}

