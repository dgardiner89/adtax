#!/usr/bin/env node

/**
 * AdTax API Local Testing Script
 * Run: node test-api.js
 * Make sure your dev server is running: npm run dev
 */

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const SESSION_ID = process.env.SESSION_ID || `test-session-${Date.now()}`;

async function testAPI() {
  console.log("🧪 Testing AdTax API locally");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Session ID: ${SESSION_ID}\n`);

  // First, check if server is running with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const healthCheck = await fetch(`${BASE_URL}/api/config`, {
      method: "GET",
      headers: { "x-session-id": "health-check" },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    if (error.name === "AbortError" || error.code === "ECONNREFUSED" || error.message.includes("fetch failed") || error.message.includes("network")) {
      console.error("❌ Error: Cannot connect to server");
      console.error("\nMake sure:");
      console.error("1. Dev server is running: npm run dev");
      console.error("2. Server is accessible at", BASE_URL);
      console.error("3. Check if port 3000 is in use: lsof -i :3000");
      process.exit(1);
    }
    throw error;
  }

  try {
    // Test 1: Get config (should return null initially)
    console.log("1️⃣  Testing GET /api/config (should return null)...");
    const getConfig1 = await fetch(`${BASE_URL}/api/config`, {
      headers: { "x-session-id": SESSION_ID },
    });
    
    if (!getConfig1.ok) {
      throw new Error(`HTTP ${getConfig1.status}: ${getConfig1.statusText}`);
    }
    
    const config1 = await getConfig1.json();
    console.log(JSON.stringify(config1, null, 2));
    console.log("");

    // Test 2: Seed config
    console.log("2️⃣  Seeding config...");
    const seedResponse = await fetch(`${BASE_URL}/api/seed`, {
      method: "POST",
      headers: {
        Authorization: "Bearer seed-me",
        "x-session-id": SESSION_ID,
      },
    });
    
    if (!seedResponse.ok) {
      throw new Error(`HTTP ${seedResponse.status}: ${seedResponse.statusText}`);
    }
    
    const seedResult = await seedResponse.json();
    console.log(JSON.stringify(seedResult, null, 2));
    console.log("");

    // Test 3: Get config (should now return the seeded config)
    console.log("3️⃣  Testing GET /api/config (should return seeded config)...");
    const getConfig2 = await fetch(`${BASE_URL}/api/config`, {
      headers: { "x-session-id": SESSION_ID },
    });
    
    if (!getConfig2.ok) {
      throw new Error(`HTTP ${getConfig2.status}: ${getConfig2.statusText}`);
    }
    
    const config2 = await getConfig2.json();
    if (config2.value) {
      console.log(`✅ Config found with ${config2.value.variables.length} variables`);
      console.log(`   Case transform: ${config2.value.caseTransform}`);
      console.log(`   Separator: "${config2.value.separator}"`);
    } else {
      console.log("❌ Config not found");
    }
    console.log("");

    // Test 4: Generate filename
    console.log("4️⃣  Testing POST /api/names/generate...");
    const generateResponse = await fetch(`${BASE_URL}/api/names/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": SESSION_ID,
      },
      body: JSON.stringify({
        variableValues: {
          "1": "1080x1080",
          "2": "Creator",
          "3": "Cold",
          "4": ["Hero"],
          "5": "Problem",
          "6": "Learn More",
          "7": "Minimalist",
          "8": "Summer Campaign",
        },
      }),
    });
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`HTTP ${generateResponse.status}: ${errorText}`);
    }
    
    const generateResult = await generateResponse.json();
    console.log(JSON.stringify(generateResult, null, 2));
    if (generateResult.fileName) {
      console.log(`✅ Generated filename: ${generateResult.fileName}`);
    } else {
      console.log("❌ Failed to generate filename");
    }
    console.log("");

    // Test 5: Test CORS (OPTIONS request)
    console.log("5️⃣  Testing CORS (OPTIONS request)...");
    const optionsResponse = await fetch(`${BASE_URL}/api/config`, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "x-session-id",
      },
    });
    
    const corsHeaders = {
      "access-control-allow-origin": optionsResponse.headers.get(
        "access-control-allow-origin"
      ),
      "access-control-allow-methods": optionsResponse.headers.get(
        "access-control-allow-methods"
      ),
      "access-control-allow-headers": optionsResponse.headers.get(
        "access-control-allow-headers"
      ),
    };
    console.log(JSON.stringify(corsHeaders, null, 2));
    if (corsHeaders["access-control-allow-origin"]) {
      console.log("✅ CORS headers present");
    } else {
      console.log("⚠️  CORS headers missing");
    }
    console.log("");

    console.log("✅ Testing complete!");
    console.log("\nTo test with a different session ID:");
    console.log(`SESSION_ID=my-session node test-api.js`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.cause) {
      console.error("   Cause:", error.cause);
    }
    console.error("\nTroubleshooting:");
    console.error("1. Is dev server running? Check: npm run dev");
    console.error("2. Is server accessible? Try: curl", `${BASE_URL}/api/config`);
    console.error("3. Check .env.local has UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
    console.error("4. Check server terminal for error messages");
    process.exit(1);
  }
}

testAPI();

