"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { storage } from "@/lib/storage"
import type { Config, Variable } from "@/lib/types"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"

interface GeneratedName {
  fileName: string
  metadata: Record<string, string>
  timestamp: number
}

interface VariableStats {
  variable: Variable
  optionCounts: Record<string, number>
  totalUsage: number
  customInputs: Set<string> // Track unique custom inputs
}

export default function AdMixPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<VariableStats[]>([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [configData, namesData] = await Promise.all([
          storage.get<Config>("config"),
          storage.get<GeneratedName[]>("names")
        ])

        if (configData) {
          setConfig(configData)
        }

        if (namesData && Array.isArray(namesData)) {
          const validEntries = namesData.filter(
            (entry: any) => entry && typeof entry === 'object' && entry.fileName
          ).map((entry: any) => ({
            fileName: entry.fileName,
            metadata: entry.metadata || {},
            timestamp: entry.timestamp || Date.now()
          }))
          setGeneratedNames(validEntries)
        }
      } catch (e) {
        console.error("Failed to load data:", e)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Helper to normalize for matching (case-insensitive)
  const normalizeForMatch = (value: string): string => {
    return value.toLowerCase().trim()
  }

  // Helper to match a file name part to a variable option
  const matchToOption = (part: string, options: string[], caseTransform: string, separator: string): string | null => {
    const normalizedPart = normalizeForMatch(part)
    
    // Try exact match first
    for (const option of options) {
      if (normalizeForMatch(option) === normalizedPart) {
        return option
      }
    }

    // Try matching with case transformation applied
    for (const option of options) {
      let transformedOption = option
      if (caseTransform === "uppercase") {
        transformedOption = option.toUpperCase()
      } else if (caseTransform === "lowercase") {
        transformedOption = option.toLowerCase()
      }
      
      if (normalizeForMatch(transformedOption) === normalizedPart) {
        return option
      }
    }

    // Try matching with spaces replaced by separator
    for (const option of options) {
      const optionWithSeparator = option.replace(/\s+/g, separator)
      if (normalizeForMatch(optionWithSeparator) === normalizedPart) {
        return option
      }
      
      // Also try with case transformation
      let transformedOption = optionWithSeparator
      if (caseTransform === "uppercase") {
        transformedOption = optionWithSeparator.toUpperCase()
      } else if (caseTransform === "lowercase") {
        transformedOption = optionWithSeparator.toLowerCase()
      }
      
      if (normalizeForMatch(transformedOption) === normalizedPart) {
        return option
      }
    }

    return null
  }

  // Parse file name when metadata is missing or incomplete
  const parseFileName = (fileName: string, config: Config): Record<string, string> => {
    const parts = fileName.split(config.separator)
    const parsed: Record<string, string> = {}
    
    config.variables.forEach((variable, index) => {
      const part = parts[index]
      if (!part) return

      if (variable.type === "dropdown" || variable.type === "multiselect") {
        // Try to match against variable options
        const matched = matchToOption(part, variable.values, config.caseTransform, config.separator)
        if (matched) {
          parsed[variable.id] = matched
        } else {
          // Custom input - store as-is
          parsed[variable.id] = part
        }
      } else {
        // Input field - always custom
        parsed[variable.id] = part
      }
    })

    return parsed
  }

  useEffect(() => {
    if (!config || generatedNames.length === 0) {
      setStats([])
      return
    }

    const variableStatsMap = new Map<string, VariableStats>()

    // Initialize stats for each variable
    config.variables.forEach(variable => {
      variableStatsMap.set(variable.id, {
        variable,
        optionCounts: {},
        totalUsage: 0,
        customInputs: new Set<string>()
      })
    })

    // Aggregate usage from generated names
    generatedNames.forEach(name => {
      // Determine which metadata to use - prefer stored metadata, fall back to parsing
      let metadataToUse = name.metadata
      
      // Check if metadata is incomplete (missing some variables)
      const hasIncompleteMetadata = config.variables.some(
        v => !metadataToUse[v.id] || metadataToUse[v.id].trim() === ""
      )

      // If metadata is incomplete or missing, parse from file name
      if (hasIncompleteMetadata || Object.keys(metadataToUse).length === 0) {
        const parsed = parseFileName(name.fileName, config)
        // Merge parsed with existing metadata (parsed takes precedence for missing values)
        metadataToUse = { ...metadataToUse, ...parsed }
      }

      config.variables.forEach((variable, varIndex) => {
        const value = metadataToUse[variable.id]
        if (!value || value.trim() === "") return

        const stats = variableStatsMap.get(variable.id)!
        
        if (variable.type === "multiselect") {
          // For multiselect, split comma-separated values
          const values = value.split(",").map(v => v.trim()).filter(Boolean)
          values.forEach(val => {
            // Check if this matches a predefined option
            const matched = matchToOption(val, variable.values, config.caseTransform, config.separator)
            if (matched) {
              stats.optionCounts[matched] = (stats.optionCounts[matched] || 0) + 1
            } else {
              // Custom input
              stats.customInputs.add(val)
              stats.optionCounts[val] = (stats.optionCounts[val] || 0) + 1
            }
            stats.totalUsage += 1
          })
        } else if (variable.type === "dropdown") {
          // Handle free input case
          if (value === "{free_input}") {
            return
          }
          
          // Check if this matches a predefined option
          const matched = matchToOption(value, variable.values, config.caseTransform, config.separator)
          if (matched) {
            stats.optionCounts[matched] = (stats.optionCounts[matched] || 0) + 1
          } else {
            // Custom input (free input or unmatched)
            stats.customInputs.add(value)
            stats.optionCounts[value] = (stats.optionCounts[value] || 0) + 1
          }
          stats.totalUsage += 1
        } else {
          // For input fields, always treat as custom input
          stats.customInputs.add(value)
          stats.optionCounts[value] = (stats.optionCounts[value] || 0) + 1
          stats.totalUsage += 1
        }
      })
    })

    // Convert to array and sort by total usage (descending)
    const statsArray = Array.from(variableStatsMap.values())
      .filter(s => s.totalUsage > 0) // Only show variables that have been used
      .sort((a, b) => b.totalUsage - a.totalUsage)

    setStats(statsArray)
  }, [config, generatedNames])

  const getMostUsedOption = (optionCounts: Record<string, number>): { option: string; count: number } | null => {
    const entries = Object.entries(optionCounts)
    if (entries.length === 0) return null
    
    const sorted = entries.sort((a, b) => b[1] - a[1])
    return { option: sorted[0][0], count: sorted[0][1] }
  }

  const getLeastUsedOption = (optionCounts: Record<string, number>): { option: string; count: number } | null => {
    const entries = Object.entries(optionCounts)
    if (entries.length === 0) return null
    
    const sorted = entries.sort((a, b) => a[1] - b[1])
    return { option: sorted[0][0], count: sorted[0][1] }
  }

  const getMaxCount = (optionCounts: Record<string, number>): number => {
    const counts = Object.values(optionCounts)
    return counts.length > 0 ? Math.max(...counts) : 0
  }

  if (isLoading) {
    return (
      <div className="bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading analytics...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!config || config.variables.length === 0) {
    return (
      <div className="bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                No configuration available. Generate some names first to see analytics.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (generatedNames.length === 0) {
    return (
      <div className="bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                No generated names yet. Generate some names to see usage analytics.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <div className="space-y-1">
                <CardTitle>Ad Mix Analytics</CardTitle>
                <CardDescription>
                  Usage statistics for all generated ad names ({generatedNames.length} total)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {stats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No usage data available yet.
              </div>
            ) : (
              stats.map((stat) => {
                const mostUsed = getMostUsedOption(stat.optionCounts)
                const leastUsed = getLeastUsedOption(stat.optionCounts)
                const maxCount = getMaxCount(stat.optionCounts)
                const sortedOptions = Object.entries(stat.optionCounts)
                  .sort((a, b) => b[1] - a[1])

                return (
                  <div key={stat.variable.id} className="space-y-4 border-b pb-6 last:border-b-0">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{stat.variable.label}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Total Usage: {stat.totalUsage}</span>
                        <span>•</span>
                        <span>Type: {stat.variable.type}</span>
                        {mostUsed && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Most: {mostUsed.option} ({mostUsed.count})
                            </span>
                          </>
                        )}
                        {leastUsed && leastUsed.option !== mostUsed?.option && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Least: {leastUsed.option} ({leastUsed.count})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sortedOptions.map(([option, count]) => {
                        const isCustomInput = stat.customInputs.has(option)
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                        const usagePercentage = stat.totalUsage > 0 
                          ? ((count / stat.totalUsage) * 100).toFixed(1)
                          : "0"

                        return (
                          <div key={option} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option}</span>
                                {isCustomInput && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                  {count} {count === 1 ? 'time' : 'times'}
                                </span>
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                  {usagePercentage}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${isCustomInput ? 'bg-secondary' : 'bg-primary'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

