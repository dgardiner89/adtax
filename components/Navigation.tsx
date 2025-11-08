"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="max-w-4xl mx-auto">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
            pathname === "/" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Generator
        </Link>
        <Link
          href="/config"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
            pathname === "/config" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configuration
        </Link>
        <Link
          href="/about"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/about" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          About
        </Link>
      </div>
    </nav>
  )
}

