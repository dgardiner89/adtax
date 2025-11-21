"use client"

import Link from "next/link"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const SkullAndCrossbones = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Skull */}
    <circle cx="12" cy="9" r="5" />
    <path d="M7 9c0-1.5 1.5-3 5-3s5 1.5 5 3" />
    <circle cx="10" cy="9" r="1" />
    <circle cx="14" cy="9" r="1" />
    <path d="M12 12v2" />
    {/* Crossbones */}
    <line x1="3" y1="18" x2="8" y2="13" />
    <line x1="8" y1="18" x2="3" y2="13" />
    <line x1="16" y1="18" x2="21" y2="13" />
    <line x1="21" y1="18" x2="16" y2="13" />
  </svg>
)

export function Footer() {
  const { theme, setTheme } = useTheme()
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")

  useEffect(() => {
    const checkApiStatus = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch("/api/config", {
          method: "GET",
          headers: {
            "x-session-id": "status-check",
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setApiStatus("online")
        } else {
          setApiStatus("offline")
        }
      } catch (error) {
        clearTimeout(timeoutId)
        setApiStatus("offline")
      }
    }

    checkApiStatus()
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="bg-background w-full border-t mt-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-2">AdTax</h3>
            <div className="space-y-2">
              <SkullAndCrossbones className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This tiny tool has been built for convenience by{" "}
                <a href="https://www.darrellgardiner.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Darrell Gardiner
                </a>
                {" "}for{" "}
                <a href="https://www.clipflow.co" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  Clipflow
                </a>
                . It&apos;s not safe for use for any actual business. Proceed at your own risk.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Navigation</h3>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Generator
              </Link>
              <Link href="/config" className="text-sm text-muted-foreground hover:text-foreground">
                Configuration
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Darrell Gardiner
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>API Status</span>
              <div className="relative">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    apiStatus === "online" && "bg-green-500",
                    apiStatus === "offline" && "bg-red-500",
                    apiStatus === "checking" && "bg-yellow-500 animate-pulse"
                  )}
                  title={
                    apiStatus === "online"
                      ? "API is online"
                      : apiStatus === "offline"
                      ? "API is offline"
                      : "Checking API status..."
                  }
                />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </footer>
  )
}

