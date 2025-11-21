import { kv } from "@/lib/kv"
import crypto from "crypto"

export interface ApiKeyData {
  keyId: string
  name: string
  environment: "live" | "test"
  createdAt: string
  lastUsed: string | null
  usageCount: number
}

export interface ApiKeyValidation {
  valid: boolean
  keyId?: string
  keyData?: ApiKeyData
}

/**
 * Validates an API key and returns validation result
 * Updates last used timestamp and usage count
 */
export async function validateApiKey(
  apiKey: string | null
): Promise<ApiKeyValidation> {
  if (!apiKey) {
    return { valid: false }
  }

  // Hash the provided key
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  // Look up key metadata
  const keyData = await kv.get<ApiKeyData>(`api_key:${keyHash}`)

  if (!keyData) {
    return { valid: false }
  }

  // Update last used timestamp and usage count
  const updatedKeyData: ApiKeyData = {
    ...keyData,
    lastUsed: new Date().toISOString(),
    usageCount: (keyData.usageCount || 0) + 1,
  }

  // Store updated metadata (1 year TTL)
  await kv.set(`api_key:${keyHash}`, updatedKeyData, { ex: 31536000 })

  return {
    valid: true,
    keyId: keyData.keyId,
    keyData: updatedKeyData,
  }
}

/**
 * Generates a new API key
 */
export function generateApiKey(environment: "live" | "test" = "live"): string {
  const randomBytes = crypto.randomBytes(32)
  const key = randomBytes.toString("base64url")
  return `adtax_${environment}_${key}`
}

/**
 * Hashes an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex")
}

