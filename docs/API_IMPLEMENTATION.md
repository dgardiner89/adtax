# AdTax API Implementation

This document describes the API endpoints implemented in the AdTax application to support the Figma plugin and web interface.

## Overview

The API uses session-based storage with Upstash Redis (KV) for persistence. All endpoints support CORS for Figma plugin access.

**Storage Keys:**
- `config:${sessionId}` - Stores naming configuration
- `names:${sessionId}` - Stores generated names (optional)
- `api_key:${keyHash}` - Stores API key metadata (hashed)
- `key_meta:${keyId}` - Stores API key metadata by ID
- `api_keys:all` - Set of all API key IDs

**Session Management:**
- Session IDs are passed via `x-session-id` header
- Web app generates session IDs: `session_${timestamp}_${random}`
- Figma plugin uses: `figma_${timestamp}_${random}`

**API Key Authentication:**
- API keys are optional on all endpoints (backward compatible)
- Pass API key via `x-api-key` header
- Keys are hashed before storage (SHA-256)
- Keys track usage count and last used timestamp
- Format: `adtax_live_...` or `adtax_test_...`

## Data Structures

### Variable Type
```typescript
type VariableType = "dropdown" | "multiselect" | "input"
```

### Variable Interface
```typescript
interface Variable {
  id: string
  label: string
  type: VariableType
  values: string[]
  description?: string
  optionDescriptions?: Record<string, string>
  allowFreeInput?: boolean
}
```

### Config Interface
```typescript
interface Config {
  variables: Variable[]
  caseTransform: "uppercase" | "lowercase" | "none"
  separator: string
  locked?: boolean
}
```

## Endpoints

### 1. GET /api/config

Retrieves the naming configuration for a session.

**Request:**
```
GET /api/config
Headers:
  x-session-id: <session-id-string>
  x-api-key: <api-key> (optional)
```

**Response (200 OK):**
```json
{
  "value": {
    "variables": [
      {
        "id": "1",
        "label": "Size",
        "type": "dropdown",
        "values": ["1080x1080", "1080x1350", "1920x1080"],
        "description": "The dimensions of the ad creative",
        "optionDescriptions": {
          "1080x1080": "Square format, ideal for Instagram feed"
        }
      }
    ],
    "caseTransform": "lowercase",
    "separator": "_",
    "locked": false
  }
}
```

**No Config (200 OK):**
```json
{
  "value": null
}
```

**Error (401):**
```json
{
  "error": "Invalid API key"
}
```

**Error (500):**
```json
{
  "error": "Failed to fetch config"
}
```

**Implementation Details:**
- Key: `config:${sessionId}`
- Returns `null` if session ID missing or config not found
- Includes CORS headers for Figma plugin
- If `x-api-key` provided, validates key and tracks usage

---

### 2. POST /api/config

Saves a naming configuration for a session.

**Request:**
```
POST /api/config
Headers:
  Content-Type: application/json
  x-session-id: <session-id-string>
Body:
{
  "value": {
    "variables": [...],
    "caseTransform": "lowercase",
    "separator": "_"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error (400/500):**
```json
{
  "error": "Session ID required"
}
```

**Implementation Details:**
- Key: `config:${sessionId}`
- Overwrites existing config if present
- Validates session ID is provided

---

### 3. DELETE /api/config

Deletes the naming configuration for a session.

**Request:**
```
DELETE /api/config
Headers:
  x-session-id: <session-id-string>
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error (400/500):**
```json
{
  "error": "Session ID required"
}
```

---

### 4. POST /api/names/generate

Generates a filename based on variable values and the session's configuration.

**Request:**
```
POST /api/names/generate
Headers:
  Content-Type: application/json
  x-session-id: <session-id-string>
  x-api-key: <api-key> (optional)
Body:
{
  "variableValues": {
    "1": "1080x1080",
    "2": "Creator",
    "3": "Cold",
    "4": ["Hero", "Sage"],
    "5": "Problem",
    "6": "Learn More",
    "7": "Minimalist",
    "8": "Summer Campaign"
  }
}
```

**Response (200 OK):**
```json
{
  "fileName": "1080x1080_creator_cold_hero_problem_learn_more_minimalist_summer_campaign"
}
```

**Error (400):**
```json
{
  "error": "Session ID required"
}
```

**Error (404):**
```json
{
  "error": "Configuration not found"
}
```

**Error (401):**
```json
{
  "error": "Invalid API key"
}
```

**Error (400):**
```json
{
  "error": "Could not generate filename from provided values"
}
```

**Filename Generation Logic:**

1. Iterates through config variables in order
2. For each variable:
   - **multiselect**: Uses first selected value, trims and replaces spaces with separator
   - **input**: Trims and replaces spaces with separator
   - **dropdown**: 
     - If value is `{free_input}`, looks for `${variable.id}_free` in variableValues
     - Otherwise trims and replaces spaces with separator
3. Filters out empty parts
4. Applies case transform (uppercase/lowercase/none) to each part
5. Joins parts with separator

**Implementation Details:**
- Key: `config:${sessionId}` (to retrieve config)
- Supports CORS for Figma plugin
- Handles free input for dropdowns via `${variable.id}_free` key
- Returns empty string if no valid parts generated

---

### 5. GET /api/names

Retrieves stored names for a session (optional feature).

**Request:**
```
GET /api/names
Headers:
  x-session-id: <session-id-string>
```

**Response (200 OK):**
```json
{
  "value": <stored-names-data>
}
```

**No Data (200 OK):**
```json
{
  "value": null
}
```

**Implementation Details:**
- Key: `names:${sessionId}`
- Returns `null` if session ID missing or no data found

---

### 6. POST /api/names

Saves names for a session (optional feature).

**Request:**
```
POST /api/names
Headers:
  Content-Type: application/json
  x-session-id: <session-id-string>
Body:
{
  "value": <names-data>
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Implementation Details:**
- Key: `names:${sessionId}`
- Overwrites existing data if present

---

### 7. DELETE /api/names

Deletes stored names for a session.

**Request:**
```
DELETE /api/names
Headers:
  x-session-id: <session-id-string>
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

### 8. POST /api/seed

Seeds the database with example configuration data.

**Request:**
```
POST /api/seed
Headers:
  Authorization: Bearer <SEED_KEY>
  x-session-id: <session-id-string> (optional, defaults to "default")
```

**Response (200 OK):**
```json
{
  "message": "Database seeded successfully",
  "config": { ... }
}
```

**Already Exists (200 OK):**
```json
{
  "message": "Config already exists, skipping seed",
  "existing": true
}
```

**Error (401):**
```json
{
  "error": "Unauthorized"
}
```

**Implementation Details:**
- Requires `Authorization: Bearer ${SEED_KEY}` header
- `SEED_KEY` from environment variable (defaults to "seed-me")
- Key: `config:${sessionId}` (defaults to "default" if not provided)
- Skips seeding if config already exists
- Seeds example config with 8 variables (Size, Persona, Funnel Stage, Archetype, Hook, CTA, Style, Ad Description)

---

## CORS Headers

All endpoints that support CORS include these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-session-id, x-api-key
```

Endpoints with CORS:
- `/api/config` (GET, POST, DELETE, OPTIONS)
- `/api/names/generate` (POST, OPTIONS)

---

### 9. POST /api/keys

Creates a new API key.

**Request:**
```
POST /api/keys
Headers:
  Content-Type: application/json
Body:
{
  "name": "Figma Plugin Key",
  "environment": "live" | "test"
}
```

**Response (200 OK):**
```json
{
  "apiKey": "adtax_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
  "keyId": "key_1234567890_abc123",
  "name": "Figma Plugin Key",
  "createdAt": "2025-01-21T05:00:00.000Z",
  "environment": "live"
}
```

**Error (400):**
```json
{
  "error": "Environment must be 'live' or 'test'"
}
```

**Implementation Details:**
- Generates 32 random bytes, base64url encoded
- Key format: `adtax_{environment}_{random}`
- Key is hashed (SHA-256) before storage
- Key metadata stored with 1 year TTL
- **Important:** Plain key is only returned once in the response

---

### 10. GET /api/keys

Lists all API keys (metadata only, no actual keys).

**Request:**
```
GET /api/keys
```

**Response (200 OK):**
```json
{
  "keys": [
    {
      "keyId": "key_1234567890_abc123",
      "name": "Figma Plugin Key",
      "environment": "live",
      "createdAt": "2025-01-21T05:00:00.000Z",
      "lastUsed": "2025-01-21T06:30:00.000Z",
      "usageCount": 42
    }
  ]
}
```

**Implementation Details:**
- Returns metadata only (never returns actual keys)
- Includes usage statistics
- Keys are listed in creation order

---

### 11. DELETE /api/keys/:keyId

Revokes an API key.

**Request:**
```
DELETE /api/keys/:keyId
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error (404):**
```json
{
  "error": "Key not found"
}
```

**Implementation Details:**
- Deletes key metadata
- Note: Hashed key lookup remains until TTL expires (1 year)
- Key will be invalid after deletion

---

## API Key Authentication

### Usage

API keys are **optional** on all endpoints. If provided, they are validated and usage is tracked.

**Example with API key:**
```bash
curl -H "x-api-key: adtax_live_..." \
  -H "x-session-id: test-123" \
  http://localhost:3000/api/config
```

**Example without API key (still works):**
```bash
curl -H "x-session-id: test-123" \
  http://localhost:3000/api/config
```

### Key Generation

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "My Key", "environment": "live"}' \
  http://localhost:3000/api/keys
```

**Save the `apiKey` value immediately** - it's only shown once!

### Key Validation

- Keys are validated on each request if provided
- Invalid keys return 401 Unauthorized
- Valid keys track:
  - Last used timestamp
  - Usage count
  - Creation date

### Security Notes

1. **Never log API keys** - They are hashed before storage
2. **HTTPS only** - Use HTTPS in production
3. **Key rotation** - Generate new keys and revoke old ones
4. **Key expiration** - Keys expire after 1 year (TTL)
5. **Store securely** - Treat API keys like passwords

---

## Storage Implementation

**Current:** Upstash Redis (via `@upstash/redis`)

**Environment Variables:**
- `UPSTASH_REDIS_REST_URL` - Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis REST API token

**Storage Abstraction:**
- KV operations centralized in `lib/kv.ts`
- Easy to migrate to Supabase or other storage later
- Client-side uses `lib/storage.ts` which calls API routes

---

## Example Config

The seed endpoint creates a config with these variables:

1. **Size** (dropdown): 1080x1080, 1080x1350, 1080x1920, 1920x1080, 1200x628
2. **Persona** (dropdown): Creator, Business, Agency, Generic
3. **Funnel Stage** (dropdown): Cold, Warm, Hot
4. **Archetype** (multiselect): Hero, Sage, Outlaw, Explorer, Creator, Ruler, Magician, Innocent, Caregiver, Jester, Lover, Orphan
5. **Hook** (dropdown): Problem, Solution, Story, Question, Statistic, Controversy
6. **CTA** (dropdown): Learn More, Sign Up, Buy Now, Download, Get Started, Watch Now
7. **Style** (dropdown): Minimalist, Bold, Playful, Professional, Vintage, Modern
8. **Ad Description** (input): Free text input

Default settings:
- `caseTransform`: "lowercase"
- `separator`: "_"

---

## Testing

### Using cURL

**Get Config:**
```bash
curl -H "x-session-id: test-session-123" \
  https://adtax.vercel.app/api/config
```

**Save Config:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-123" \
  -d '{"value": {"variables": [...], "caseTransform": "lowercase", "separator": "_"}}' \
  https://adtax.vercel.app/api/config
```

**Generate Filename:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-123" \
  -H "x-api-key: adtax_live_..." \
  -d '{"variableValues": {"1": "1080x1080", "2": "Creator"}}' \
  https://adtax.vercel.app/api/names/generate
```

**Generate API Key:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "Figma Plugin", "environment": "live"}' \
  https://adtax.vercel.app/api/keys
```

**List API Keys:**
```bash
curl https://adtax.vercel.app/api/keys
```

**Revoke API Key:**
```bash
curl -X DELETE https://adtax.vercel.app/api/keys/key_1234567890_abc123
```

**Seed Database:**
```bash
curl -X POST \
  -H "Authorization: Bearer seed-me" \
  -H "x-session-id: default" \
  https://adtax.vercel.app/api/seed
```

---

## Error Handling

All endpoints follow consistent error handling:
- Missing session ID: 400 Bad Request
- Invalid API key: 401 Unauthorized
- Not found: 404 Not Found (for generate endpoint, key revocation)
- Server errors: 500 Internal Server Error
- All errors return JSON: `{ "error": "Error message" }`

---

## Future Considerations

- User authentication/authorization
- Config versioning
- Config sharing between sessions
- Analytics tracking
- Migration to Supabase for relational data needs
