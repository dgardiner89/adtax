import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import type { Config, Variable } from "@/lib/types"

// CORS headers for Figma plugin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-session-id",
}

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

    return NextResponse.json(
      { fileName },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("Error generating filename:", error)
    return NextResponse.json(
      { error: "Failed to generate filename" },
      { status: 500, headers: corsHeaders }
    )
  }
}

