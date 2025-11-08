// Storage abstraction layer - easy to swap KV for Supabase later
import { getSessionId } from "./session"

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
}

// Client-side API adapter (calls Next.js API routes)
export class ApiStorageAdapter implements StorageAdapter {
  private baseUrl: string

  constructor() {
    this.baseUrl = "/api"
  }

  private getHeaders(): HeadersInit {
    const sessionId = getSessionId()
    return {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${key}`, {
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      const data = await response.json()
      return data.value as T
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const url = `${this.baseUrl}/${key}`
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ value }),
      })
      
      if (!response.ok) {
        let errorMessage = `Failed to save: ${response.statusText} (${response.status})`
        try {
          const data = await response.json()
          if (data.error) {
            errorMessage = data.error
          }
        } catch {
          // Response is not JSON, use status text
        }
        console.error(`Storage set failed for ${key} at ${url}:`, errorMessage)
        throw new Error(errorMessage)
      }
      
      // Parse response for success case
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error(`Storage set error for ${key} at ${url}:`, error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${key}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      })
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Storage delete error for ${key}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const storage = new ApiStorageAdapter()

