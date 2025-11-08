import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    if (!sessionId) {
      return NextResponse.json({ value: null }, { status: 200 })
    }

    const key = `names:${sessionId}`
    const value = await kv.get(key)
    
    return NextResponse.json({ value: value || null })
  } catch (error) {
    console.error("Error fetching names:", error)
    return NextResponse.json(
      { error: "Failed to fetch names" },
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
    const key = `names:${sessionId}`
    
    await kv.set(key, value)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving names:", error)
    return NextResponse.json(
      { error: "Failed to save names" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id")
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      )
    }

    const key = `names:${sessionId}`
    await kv.del(key)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting names:", error)
    return NextResponse.json(
      { error: "Failed to delete names" },
      { status: 500 }
    )
  }
}

