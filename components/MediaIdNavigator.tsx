"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function MediaIdNavigator() {
  const [mediaId, setMediaId] = useState("")

  const handleNavigate = () => {
    if (!mediaId.trim()) return
    
    const url = `https://app.clipflow.co/v3/media_files/${mediaId.trim()}/review`
    window.open(url, "_blank")
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Media ID</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <Input
            placeholder="ID"
            value={mediaId}
            onChange={(e) => setMediaId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm pr-10"
          />
          <Button
            onClick={handleNavigate}
            disabled={!mediaId.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            size="sm"
            variant="ghost"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

