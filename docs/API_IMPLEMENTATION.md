# AdTax API Implementation

This document describes the API endpoints implemented in the AdTax application to support the Figma plugin and web interface.

## Overview

The API uses session-based storage with Upstash Redis (KV) for persistence. All endpoints support CORS for Figma plugin access.

**Storage Keys:**
- `config:${sessionId}` - Stores naming configuration
- `names:${sessionId}` - Stores generated names (optional)

**Session Management:**
- Session IDs are passed via `x-session-id` header
- Web app generates session IDs: `session_${timestamp}_${random}`
- Figma plugin uses: `figma_${timestamp}_${random}`

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
Access-Control-Allow-Headers: Content-Type, x-session-id
```

Endpoints with CORS:
- `/api/config` (GET, POST, DELETE, OPTIONS)
- `/api/names/generate` (POST, OPTIONS)

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
  -d '{"variableValues": {"1": "1080x1080", "2": "Creator"}}' \
  https://adtax.vercel.app/api/names/generate
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
- Not found: 404 Not Found (for generate endpoint)
- Server errors: 500 Internal Server Error
- All errors return JSON: `{ "error": "Error message" }`

---

## Future Considerations

- User authentication/authorization
- Config versioning
- Config sharing between sessions
- Analytics tracking
- Migration to Supabase for relational data needs
