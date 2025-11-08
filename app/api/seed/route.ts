import { NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/kv"
import type { Config, Variable } from "@/lib/types"

// Example seed data
const exampleConfig: Config = {
  variables: [
    {
      id: "1",
      label: "Size",
      type: "dropdown",
      values: ["1080x1080", "1080x1350", "1080x1920", "1920x1080", "1200x628"],
      description: "The dimensions of the ad creative",
      optionDescriptions: {
        "1080x1080": "Square format, ideal for Instagram feed",
        "1080x1350": "Portrait format, good for Instagram Stories",
        "1080x1920": "Vertical format, perfect for Reels and Stories",
        "1920x1080": "Landscape format, standard for video ads",
        "1200x628": "Facebook link preview format"
      }
    },
    {
      id: "2",
      label: "Persona",
      type: "dropdown",
      values: ["Creator", "Business", "Agency", "Generic"],
      description: "The target audience persona for this ad",
      optionDescriptions: {
        "Creator": "Content creators and influencers",
        "Business": "Business owners and entrepreneurs",
        "Agency": "Marketing agencies and professionals",
        "Generic": "General audience"
      }
    },
    {
      id: "3",
      label: "Funnel Stage",
      type: "dropdown",
      values: ["Cold", "Warm", "Hot"],
      description: "The stage of the marketing funnel",
      optionDescriptions: {
        "Cold": "Top of funnel - awareness stage",
        "Warm": "Middle of funnel - consideration stage",
        "Hot": "Bottom of funnel - conversion stage"
      }
    },
    {
      id: "4",
      label: "Archetype",
      type: "multiselect",
      values: ["Hero", "Sage", "Outlaw", "Explorer", "Creator", "Ruler", "Magician", "Innocent", "Caregiver", "Jester", "Lover", "Orphan"],
      description: "Brand archetype(s) represented in the ad",
      optionDescriptions: {
        "Hero": "Overcomes challenges and adversity",
        "Sage": "Seeks truth and wisdom",
        "Outlaw": "Rebels against the status quo",
        "Explorer": "Seeks freedom and adventure",
        "Creator": "Brings imagination to life",
        "Ruler": "Takes control and leads",
        "Magician": "Transforms reality",
        "Innocent": "Optimistic and pure",
        "Caregiver": "Nurtures and protects",
        "Jester": "Brings joy and humor",
        "Lover": "Seeks connection and intimacy",
        "Orphan": "Seeks belonging and acceptance"
      }
    },
    {
      id: "5",
      label: "Hook",
      type: "dropdown",
      values: ["Problem", "Solution", "Story", "Question", "Statistic", "Controversy"],
      description: "The hook type used to capture attention",
      optionDescriptions: {
        "Problem": "Highlights a pain point",
        "Solution": "Presents a solution",
        "Story": "Uses narrative to engage",
        "Question": "Asks a thought-provoking question",
        "Statistic": "Uses data to make a point",
        "Controversy": "Challenges conventional thinking"
      }
    },
    {
      id: "6",
      label: "CTA",
      type: "dropdown",
      values: ["Learn More", "Sign Up", "Buy Now", "Download", "Get Started", "Watch Now"],
      description: "The call-to-action in the ad",
      optionDescriptions: {
        "Learn More": "Encourages information seeking",
        "Sign Up": "Prompts registration",
        "Buy Now": "Direct purchase action",
        "Download": "Promotes app or resource download",
        "Get Started": "Initiates onboarding",
        "Watch Now": "Encourages video consumption"
      }
    },
    {
      id: "7",
      label: "Style",
      type: "dropdown",
      values: ["Minimalist", "Bold", "Playful", "Professional", "Vintage", "Modern"],
      description: "The visual style of the ad creative",
      optionDescriptions: {
        "Minimalist": "Clean and simple design",
        "Bold": "High contrast and attention-grabbing",
        "Playful": "Fun and energetic",
        "Professional": "Corporate and polished",
        "Vintage": "Retro aesthetic",
        "Modern": "Contemporary and sleek"
      }
    },
    {
      id: "8",
      label: "Ad Description",
      type: "input",
      values: [],
      description: "Brief description of the ad content"
    }
  ],
  caseTransform: "lowercase",
  separator: "_",
  locked: false
}

export async function POST(request: NextRequest) {
  try {
    // Only allow seeding in production or with explicit permission
    const authHeader = request.headers.get("authorization")
    const seedKey = process.env.SEED_KEY || "seed-me"
    
    if (authHeader !== `Bearer ${seedKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const sessionId = request.headers.get("x-session-id") || "default"
    const key = `config:${sessionId}`

    // Check if config already exists
    const existing = await kv.get(key)
    if (existing) {
      return NextResponse.json(
        { message: "Config already exists, skipping seed", existing: true },
        { status: 200 }
      )
    }

    // Seed the config
    await kv.set(key, exampleConfig)

    return NextResponse.json(
      { message: "Database seeded successfully", config: exampleConfig },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    )
  }
}

