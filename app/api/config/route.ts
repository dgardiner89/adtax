import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    if (!sessionId) {
      return NextResponse.json({ value: null }, { status: 200 })
    }

    const key = `config:${sessionId}`
    const value = await kv.get(key)
    
    return NextResponse.json({ value: value || null })
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const { value } = await request.json()
    const key = `config:${sessionId}`
    
    await kv.set(key, value)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving config:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save config"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

