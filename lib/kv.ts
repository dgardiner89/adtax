import { Redis } from "@upstash/redis"

// Initialize Upstash Redis client
// Environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis

try {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set")
  }

  redis = new Redis({
    url,
    token,
  })
} catch (error) {
  console.error("Failed to initialize Upstash Redis:", error)
  throw error
}

// Export redis client for use in API routes
// This file centralizes Redis initialization for easy migration to Supabase later
export { redis as kv }

