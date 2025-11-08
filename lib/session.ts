"use client"

const SESSION_ID_KEY = "adtax-session-id"

export function getSessionId(): string {
  if (typeof window === "undefined") return ""
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

