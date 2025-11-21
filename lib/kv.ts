import { Redis } from "@upstash/redis"

// Initialize Upstash Redis client lazily
// Environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null

function getRedis(): Redis {
  if (redis) {
    return redis
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set")
  }

  redis = new Redis({
    url,
    token,
  })

  return redis
}

// Create a proxy object that lazily initializes Redis and forwards method calls
const kv = new Proxy({} as Redis, {
  get(_target, prop) {
    const redisInstance = getRedis()
    const value = (redisInstance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(redisInstance)
    }
    return value
  }
})

// Export redis client for use in API routes
// This file centralizes Redis initialization for easy migration to Supabase later
export { kv }

