# AdTax - Meta Ad File Name Generator

A simple Next.js app to generate file names for meta ads with configurable parameters.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setup

### Upstash Redis (Production)

1. Create an Upstash Redis database at [upstash.com](https://upstash.com)
2. Add environment variables to your project:
   - `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token
   - `NEXT_PUBLIC_APP_PASSWORD` - Password for generating/deleting file names (optional, defaults to "adtax")

You can find these in your Upstash dashboard under your database's "REST API" section.

### Password Protection

The app requires a password to generate or delete file names. Configure the password using an environment variable:

- `NEXT_PUBLIC_APP_PASSWORD` - The password required to generate or delete file names (defaults to "adtax" for development)

**Note**: Authentication is session-based and stored in the browser's sessionStorage. Users only need to enter the password once per browser session.

### Local Development

For local development, create a `.env.local` file with your Upstash credentials and optional password:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_APP_PASSWORD=your-password
```

The app will automatically migrate data from localStorage to Redis on first load.

## Features

- Select boxes for all ad configuration types (Size, Persona, Funnel, Archetype, Hook, CTA, Style)
- Input field for Ad Description
- Generates file names with underscores between all items
- Cloud storage with Upstash Redis (migrates from localStorage automatically)
- Copy to clipboard functionality
- Delete individual entries or clear all
- Session-based data isolation
- Password protection for generate and delete operations
- Session-based authentication (password required once per browser session)

## Usage

1. Select values from the dropdowns and enter an ad description
2. The file name will be generated in real-time below the form
3. When you click "Generate & Save" or try to delete an entry, you'll be prompted for a password (first time only per session)
4. After authentication, click "Generate & Save" to add the file name to your list
5. Click the copy icon to copy any file name to clipboard (no password required)
6. Click the trash icon to delete individual entries (requires authentication)
7. Click "Clear All" to delete all entries (requires authentication)

**Note**: Copying file names does not require authentication. Only generating and deleting operations are protected.

## Architecture

- **Storage**: Upstash Redis with abstraction layer for easy migration to Supabase
- **Session Management**: Client-side session IDs stored in localStorage
- **API Routes**: Next.js API routes handle all storage operations

## Testing the API Locally

### Prerequisites

1. Start the dev server: `npm run dev`
2. Ensure `.env.local` has your Upstash credentials (see Setup above)

### Quick Test Script

Run the automated test script:

```bash
./test-api.sh
```

This will test:
- GET /api/config
- POST /api/seed (creates example config)
- GET /api/config (verifies config was saved)
- POST /api/names/generate (generates a filename)
- CORS headers

### Manual Testing with cURL

**1. Get config (should return null initially):**
```bash
curl -H "x-session-id: test-123" http://localhost:3000/api/config
```

**2. Seed example config:**
```bash
curl -X POST \
  -H "Authorization: Bearer seed-me" \
  -H "x-session-id: test-123" \
  http://localhost:3000/api/seed
```

**3. Get config again (should return seeded config):**
```bash
curl -H "x-session-id: test-123" http://localhost:3000/api/config
```

**4. Generate a filename:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-123" \
  -d '{
    "variableValues": {
      "1": "1080x1080",
      "2": "Creator",
      "3": "Cold",
      "4": ["Hero"],
      "5": "Problem",
      "6": "Learn More",
      "7": "Minimalist",
      "8": "Summer Campaign"
    }
  }' \
  http://localhost:3000/api/names/generate
```

**Expected response:**
```json
{
  "fileName": "1080x1080_creator_cold_hero_problem_learn_more_minimalist_summer_campaign"
}
```

### Testing with Figma Plugin

To test with the Figma plugin locally:

1. Update the plugin's API URL to `http://localhost:3000`
2. The plugin will need to handle CORS (which is already configured)
3. Use a session ID like `figma_1234567890_abc123`

**Note:** If testing from Figma plugin, you may need to use a tool like [ngrok](https://ngrok.com) to expose your local server, as Figma plugins may have restrictions on localhost connections.

