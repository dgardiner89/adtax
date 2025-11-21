import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import { validateApiKey, generateApiKey, hashApiKey, type ApiKeyData } from "@/lib/api-key-auth"
import { corsHeaders } from "@/lib/cors"
import type { Config, Variable } from "@/lib/types"

function transformValue(value: string, caseTransform: string): string {
  switch (caseTransform) {
    case "uppercase":
      return value.toUpperCase()
    case "lowercase":
      return value.toLowerCase()
    default:
      return value
  }
}

function generateFileName(
  config: Config,
  variableValues: Record<string, string | string[]>
): string {
  const parts: string[] = []

  config.variables.forEach((variable) => {
    const value = variableValues[variable.id]

    if (variable.type === "multiselect") {
      const selected = Array.isArray(value) ? value : []
      if (selected.length > 0) {
        // For multiselect, use first value
        const cleaned = selected[0].trim().replace(/\s+/g, config.separator)
        if (cleaned) {
          parts.push(cleaned)
        }
      }
    } else if (variable.type === "input") {
      const inputValue = typeof value === "string" ? value : ""
      const cleaned = inputValue.trim().replace(/\s+/g, config.separator)
      if (cleaned) {
        parts.push(cleaned)
      }
    } else {
      // dropdown
      const dropdownValue = typeof value === "string" ? value : ""
      if (dropdownValue && dropdownValue !== "{free_input}") {
        const cleaned = dropdownValue.trim().replace(/\s+/g, config.separator)
        if (cleaned) {
          parts.push(cleaned)
        }
      } else if (dropdownValue === "{free_input}") {
        // Free input should be provided in variableValues with the actual value
        const freeValue = variableValues[`${variable.id}_free`] || ""
        if (freeValue) {
          parts.push(
            (typeof freeValue === "string" ? freeValue : "").trim().replace(/\s+/g, config.separator)
          )
        }
      }
    }
  })

  if (parts.length === 0) return ""

  const transformed = parts.map((part) => transformValue(part, config.caseTransform))
  return transformed.join(config.separator)
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || request.nextUrl.searchParams.get("sessionId")
    let apiKey = request.headers.get("x-api-key")
    const autoCreateKey = request.headers.get("x-auto-create-key") === "true"

    let newApiKey: string | undefined

    // Auto-create API key if requested and none provided
    if (autoCreateKey && !apiKey) {
      newApiKey = generateApiKey("live")
      const keyHash = hashApiKey(newApiKey)
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

      const keyData: ApiKeyData = {
        keyId,
        name: `Auto-generated for session ${sessionId?.substring(0, 20)}`,
        environment: "live",
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
      }

      await kv.set(`api_key:${keyHash}`, keyData, { ex: 31536000 })
      await kv.set(`key_meta:${keyId}`, keyData, { ex: 31536000 })
      await kv.sadd("api_keys:all", keyId)

      apiKey = newApiKey
    }

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

    const { variableValues } = await request.json()

    if (!variableValues || typeof variableValues !== "object") {
      return NextResponse.json(
        { error: "variableValues object required" },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get config
    const key = `config:${sessionId}`
    const config = await kv.get<Config>(key)

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404, headers: corsHeaders }
      )
    }

    // Generate filename
    const fileName = generateFileName(config, variableValues)

    if (!fileName) {
      return NextResponse.json(
        { error: "Could not generate filename from provided values" },
        { status: 400, headers: corsHeaders }
      )
    }

    const response: { fileName: string; apiKey?: string } = { fileName }
    
    // Include new API key in response if auto-created
    if (newApiKey) {
      response.apiKey = newApiKey
    }

    const responseHeaders: Record<string, string> = { ...corsHeaders }
    if (newApiKey) {
      responseHeaders["X-New-Api-Key"] = newApiKey
    }

    return NextResponse.json(
      response,
      { headers: responseHeaders }
    )
  } catch (error) {
    console.error("Error generating filename:", error)
    return NextResponse.json(
      { error: "Failed to generate filename" },
      { status: 500, headers: corsHeaders }
    )
  }
}

