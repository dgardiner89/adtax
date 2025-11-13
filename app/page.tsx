"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, Trash2, ChevronsUpDown, Check, X, Info, Settings, Plus } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { storage } from "@/lib/storage"
import type { Config, Variable } from "@/lib/types"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"

const STORAGE_KEY = "adtax-generated-names"

// Label with info icon component
const LabelWithInfo = ({ description, label, variableId }: { description?: string; label: string; variableId?: string }) => {
  if (!description) return <Label>{label}</Label>

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center justify-between w-full cursor-help">
          <Label>{label}</Label>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="end">
        <div className="space-y-3">
          <p className="text-sm">{description}</p>
          {variableId && (
            <Link href={`/config?edit=${variableId}`}>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                Edit variable
              </Button>
            </Link>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

interface GeneratedName {
  fileName: string
  metadata: Record<string, string>
  timestamp: number
}

export default function Home() {
  const [config, setConfig] = useState<Config | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string | string[]>>({})
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({})
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [freeInputs, setFreeInputs] = useState<Record<string, string>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [pendingAction, setPendingAction] = useState<"generate" | "delete" | "clearAll" | null>(null)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null)
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)

  const parseFileName = (fileName: string, variables: Variable[], separator: string): GeneratedName['metadata'] => {
    const parts = fileName.split(separator)
    const metadata: Record<string, string> = {}
    
    // Try to parse based on variable order
    variables.forEach((variable, index) => {
      if (variable.type === "multiselect") {
        // For multiselect, we'd need to know how many values were selected
        // This is a limitation - we'll store the combined value
        metadata[variable.id] = parts[index] || ''
      } else {
        metadata[variable.id] = parts[index] || ''
      }
    })
    
    return metadata
  }

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authStatus = sessionStorage.getItem("adtax-authenticated")
      if (authStatus === "true") {
        setIsAuthenticated(true)
      }
    }
  }, [])

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await storage.get<Config>("config")
        if (stored) {
          setConfig(stored)
          // Initialize variable values
          const initialValues: Record<string, string | string[]> = {}
          stored.variables.forEach(v => {
            if (v.type === "multiselect") {
              initialValues[v.id] = []
            } else {
              initialValues[v.id] = ""
            }
          })
          setVariableValues(initialValues)
        }
      } catch (e) {
        console.error("Failed to load config:", e)
      }
    }
    
    loadConfig()
  }, [])

  // Load generated names
  useEffect(() => {
    const loadNames = async () => {
      if (!config) return
      
      // First, try to migrate from localStorage if it exists
      const localStored = localStorage.getItem(STORAGE_KEY)
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored)
          if (Array.isArray(parsed)) {
            let migrated: GeneratedName[] = []
            if (parsed.length === 0) {
              migrated = []
            } else if (typeof parsed[0] === 'string') {
              // Old format - convert to new format
              migrated = parsed.map((fileName: string) => ({
                fileName,
                metadata: parseFileName(fileName, config.variables, config.separator),
                timestamp: Date.now()
              }))
            } else {
              // New format - validate structure
              migrated = parsed.filter((entry: any) => 
                entry && typeof entry === 'object' && entry.fileName && entry.metadata
              )
            }
            setGeneratedNames(migrated)
            // Migrate to KV storage
            await storage.set("names", migrated)
            // Clear localStorage after migration
            localStorage.removeItem(STORAGE_KEY)
            return
          }
        } catch (e) {
          console.error("Failed to parse localStorage data:", e)
        }
      }
      
      // Load from KV storage
      try {
        const stored = await storage.get<GeneratedName[]>("names")
        if (stored && Array.isArray(stored)) {
          const validEntries = stored.filter((entry: any) => 
            entry && typeof entry === 'object' && entry.fileName && entry.metadata
          )
          setGeneratedNames(validEntries)
        }
      } catch (e) {
        console.error("Failed to load stored names:", e)
        setGeneratedNames([])
      }
    }
    
    loadNames()
  }, [config])

  const transformValue = (value: string): string => {
    if (!config) return value
    switch (config.caseTransform) {
      case "uppercase":
        return value.toUpperCase()
      case "lowercase":
        return value.toLowerCase()
      default:
        return value
    }
  }

  const generateFileName = (valuesOverride?: Record<string, string | string[]>): string => {
    if (!config) return ""
    
    const values = valuesOverride || variableValues
    const parts: string[] = []
    
    config.variables.forEach(variable => {
      const value = values[variable.id]
      
      if (variable.type === "multiselect") {
        const selected = Array.isArray(value) ? value : []
        if (selected.length > 0) {
          // For multiselect, use first value for preview
          const cleaned = selected[0].trim().replace(/\s+/g, config.separator)
          if (cleaned) {
            parts.push(cleaned)
          }
        }
      } else if (variable.type === "input") {
        const inputValue = typeof value === "string" ? value : ""
        const cleaned = inputValue.trim().replace(/\s+/g, config.separator)
        if (cleaned) {
          parts.push(cleaned)
        }
      } else {
        // dropdown
        const dropdownValue = typeof value === "string" ? value : ""
        if (dropdownValue && dropdownValue !== "{free_input}") {
          const cleaned = dropdownValue.trim().replace(/\s+/g, config.separator)
          if (cleaned) {
            parts.push(cleaned)
          }
        } else if (dropdownValue === "{free_input}") {
          const freeValue = freeInputs[variable.id] || ""
          if (freeValue) {
            parts.push(freeValue.trim().replace(/\s+/g, config.separator))
          }
        }
      }
    })
    
    if (parts.length === 0) return ""
    
    const transformed = parts.map(part => transformValue(part))
    return transformed.join(config.separator)
  }
  
  const checkAuthAndExecute = (
    actionType: "generate" | "delete" | "clearAll",
    deleteIndex?: number,
    options?: { forceReauth?: boolean }
  ) => {
    const shouldForce = options?.forceReauth ?? false
    if (!isAuthenticated || shouldForce) {
      setPendingAction(actionType)
      if (deleteIndex !== undefined) {
        setPendingDeleteIndex(deleteIndex)
      }
      setPasswordDialogOpen(true)
      return false
    }
    return true
  }

  const executePendingAction = async () => {
    if (pendingAction === "generate") {
      await handleGenerateInternal()
    } else if (pendingAction === "delete" && pendingDeleteIndex !== null) {
      await handleDeleteInternal(pendingDeleteIndex)
    } else if (pendingAction === "clearAll") {
      await handleClearAllInternal()
    }
    setPendingAction(null)
    setPendingDeleteIndex(null)
  }

  const handlePasswordSubmit = () => {
    // Get password from environment variable (falls back to default for development)
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD || "adtax"
    
    if (password === correctPassword) {
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("adtax-authenticated", "true")
      }
      setPasswordDialogOpen(false)
      setPassword("")
      toast.success("Authenticated")
      
      // Execute pending action if any
      executePendingAction()
    } else {
      toast.error("Incorrect password")
      setPassword("")
    }
  }

  const handleGenerateInternal = async () => {
    if (!config) {
      toast.error("Configuration not loaded")
      return
    }

    const newEntries: GeneratedName[] = []
    const timestamp = Date.now()
    
    // Find multiselect variables to generate combinations
    const multiselectVars = config.variables.filter(v => v.type === "multiselect")
    
    if (multiselectVars.length > 0) {
      // Generate combinations for multiselect variables
      const firstMultiselect = multiselectVars[0]
      const selected = Array.isArray(variableValues[firstMultiselect.id]) 
        ? variableValues[firstMultiselect.id] as string[]
        : []
      
      if (selected.length === 0) {
        // No multiselect values, generate single file name
        const fileName = generateFileName()
        if (fileName) {
          const metadata: Record<string, string> = {}
          config.variables.forEach(v => {
            const val = variableValues[v.id]
            if (v.type === "multiselect") {
              metadata[v.id] = Array.isArray(val) ? val.join(",") : ""
            } else {
              metadata[v.id] = typeof val === "string" ? val : ""
            }
          })
          newEntries.push({ fileName, metadata, timestamp })
        }
      } else {
        // Generate one file name per selected multiselect value
        for (const selectedValue of selected) {
          const tempValues = { ...variableValues, [firstMultiselect.id]: [selectedValue] }
          
          // Generate file name with this combination using tempValues
          const fileName = generateFileName(tempValues)
          if (fileName) {
            const metadata: Record<string, string> = {}
            config.variables.forEach(v => {
              const val = tempValues[v.id]
              if (v.type === "multiselect") {
                metadata[v.id] = Array.isArray(val) ? val.join(",") : ""
              } else {
                metadata[v.id] = typeof val === "string" ? val : ""
              }
            })
            newEntries.push({ fileName, metadata, timestamp })
          }
        }
      }
    } else {
      // No multiselect, generate single file name
      const fileName = generateFileName()
      if (fileName) {
        const metadata: Record<string, string> = {}
        config.variables.forEach(v => {
          const val = variableValues[v.id]
          if (v.type === "multiselect") {
            metadata[v.id] = Array.isArray(val) ? val.join(",") : ""
          } else {
            metadata[v.id] = typeof val === "string" ? val : ""
          }
        })
        newEntries.push({ fileName, metadata, timestamp })
      }
    }

    if (newEntries.length === 0) return

    const allFileNames = newEntries.map(e => e.fileName).join("\n")
    await navigator.clipboard.writeText(allFileNames)
    
    const message = newEntries.length === 1 
      ? "File name copied to clipboard"
      : `${newEntries.length} file names copied to clipboard`
    
    toast.success(message, {
      position: "top-center",
    })

    const updated = [...newEntries, ...generatedNames]
    setGeneratedNames(updated)
    try {
      await storage.set("names", updated)
    } catch (error) {
      console.error("Failed to save names:", error)
      toast.error("Failed to save names", { position: "top-center" })
    }
  }

  const handleGenerate = async () => {
    if (!checkAuthAndExecute("generate")) {
      return
    }
    await handleGenerateInternal()
  }

  const toggleMultiselect = (variableId: string, value: string) => {
    if (value === "__none__") {
      // Clear all selections
      setVariableValues(prev => ({
        ...prev,
        [variableId]: []
      }))
      return
    }
    
    setVariableValues(prev => {
      const current = prev[variableId]
      const selected = Array.isArray(current) ? current : []
      return {
        ...prev,
        [variableId]: selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value]
      }
    })
  }

  const setVariableValue = (variableId: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableId]: value
    }))
  }

  const updatePopoverOpen = (variableId: string, open: boolean) => {
    setPopoverOpen(prev => ({
      ...prev,
      [variableId]: open
    }))
  }

  // Render variable field based on type
  const renderVariableField = (variable: Variable): React.ReactNode[] => {
    const value = variableValues[variable.id]
    const isOpen = popoverOpen[variable.id] || false
    
    if (variable.type === "multiselect") {
      const selected = Array.isArray(value) ? value : []
      return [
        <div className="space-y-2 col-span-1 md:col-span-1" key={variable.id}>
          <LabelWithInfo description={variable.description} label={variable.label} variableId={variable.id} />
          <Popover open={isOpen} onOpenChange={(open) => updatePopoverOpen(variable.id, open)}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between min-w-0"
              >
                {selected.length === 0 
                  ? <span className="text-muted-foreground">None</span>
                  : selected.length === 1 
                  ? selected[0] 
                  : `${selected.length} selected`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No options found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="__none__"
                      onSelect={() => toggleMultiselect(variable.id, "__none__")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.length === 0 ? "opacity-100" : "opacity-0"
                        )}
                      />
                      None
                    </CommandItem>
                    {variable.values.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => toggleMultiselect(variable.id, option)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selected.includes(option) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      ]
    } else if (variable.type === "input") {
      const inputValue = typeof value === "string" ? value : ""
      return [
        <div className="space-y-2 col-span-2 md:col-span-3" key={variable.id}>
          <LabelWithInfo description={variable.description} label={variable.label} variableId={variable.id} />
          <Input
            placeholder={`Enter ${variable.label.toLowerCase()}`}
            value={inputValue}
            onChange={(e) => setVariableValue(variable.id, e.target.value)}
            className="w-full h-10"
          />
        </div>
      ]
    } else {
      // dropdown
      const dropdownValue = typeof value === "string" ? value : ""
      const isFreeInput = dropdownValue === "{free_input}"
      const freeInputValue = freeInputs[variable.id] || ""

      const dropdownField = (
        <div className="space-y-2 col-span-1 md:col-span-1" key={variable.id}>
          <LabelWithInfo description={variable.description} label={variable.label} variableId={variable.id} />
          <Select value={dropdownValue || "none"} onValueChange={(val) => {
            setVariableValue(variable.id, val === "none" ? "" : val)
            // Clear free input if switching away from free input
            if (val !== "{free_input}") {
              setFreeInputs(prev => {
                const next = { ...prev }
                delete next[variable.id]
                return next
              })
            }
          }}>
            <SelectTrigger className={cn("w-full h-10", !dropdownValue && "[&>span]:text-muted-foreground")}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {variable.values.filter(v => v !== "{free_input}").map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              {variable.allowFreeInput && (
                <SelectItem value="{free_input}">Free Input</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )

      const freeInputField = isFreeInput ? (
        <div className="space-y-2 col-span-2 md:col-span-3" key={`${variable.id}-free-input`}>
          <LabelWithInfo description={variable.description} label={variable.label} variableId={variable.id} />
          <Input
            id={`${variable.id}-free-input`}
            placeholder="Enter custom value"
            value={freeInputValue}
            onChange={(e) => setFreeInputs(prev => ({ ...prev, [variable.id]: e.target.value }))}
            className="w-full h-10"
          />
        </div>
      ) : null

      return [dropdownField, freeInputField].filter(Boolean)
    }
  }

  const handleCopy = async (fileName: string, index: number) => {
    await navigator.clipboard.writeText(fileName)
    setCopiedIndex(index)
    toast.success("File Name copied to clipboard", { position: "bottom-left" })
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDeleteInternal = async (index: number) => {
    const updated = generatedNames.filter((_, i) => i !== index)
    setGeneratedNames(updated)
    try {
      await storage.set("names", updated)
      toast.success("File Name deleted", { position: "bottom-left" })
    } catch (error) {
      console.error("Failed to delete name:", error)
      toast.error("Failed to delete name", { position: "bottom-left" })
    }
    // Reset to first page if current page becomes empty
    const totalPages = Math.ceil(updated.length / itemsPerPage)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }

  const handleDelete = async (index: number) => {
    if (!checkAuthAndExecute("delete", index)) {
      return
    }
    await handleDeleteInternal(index)
  }

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`
    if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`
    if (weeks > 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    return 'just now'
  }

  const handleClearAllInternal = async () => {
    setGeneratedNames([])
    try {
      await storage.delete("names")
      toast.success("All file names cleared", { position: "top-center" })
    } catch (error) {
      console.error("Failed to clear names:", error)
      toast.error("Failed to clear names", { position: "top-center" })
    }
  }

  const handleClearAll = () => {
    setClearAllDialogOpen(true)
  }

  const handleConfirmClearAll = async () => {
    setClearAllDialogOpen(false)
    const shouldProceed = checkAuthAndExecute("clearAll", undefined, { forceReauth: true })
    if (shouldProceed) {
      await handleClearAllInternal()
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(generatedNames.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = generatedNames.slice(indexOfFirstItem, indexOfLastItem)

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return (
    <div className="bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4 flex flex-col overflow-hidden min-h-0">
      <div className="max-w-4xl mx-auto flex-1 flex flex-col space-y-6 min-h-0 w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Meta Ad File Name Generator</CardTitle>
                <CardDescription>Configure your ad parameters to generate a file name</CardDescription>
              </div>
              <Link href="/config">
                <Button variant="ghost" size="icon" title="Open configuration">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!config ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading configuration...
              </div>
            ) : config.variables.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">No variables configured yet.</p>
                <Link href="/config">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variables
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <form className="space-y-6 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-start">
                    {config.variables
                      .slice()
                      .sort((a, b) => {
                        // Calculate effective width based on type and current state
                        const getWidth = (v: Variable) => {
                          if (v.type === "input") return 3
                          if (v.type === "multiselect") return 1
                          // For dropdowns, always return 1 (free input is a separate field)
                          return 1
                        }
                        const widthA = getWidth(a)
                        const widthB = getWidth(b)
                        // Group by width, then maintain original order within same width groups
                        if (widthA !== widthB) {
                          return widthA - widthB
                        }
                        // Within same width, maintain original order
                        return config.variables.indexOf(a) - config.variables.indexOf(b)
                      })
                      .flatMap(variable => renderVariableField(variable))}
                  </div>
                </form>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4">
                    <div className="flex-1">
                      {(() => {
                        if (!config) return null
                        
                        // Check if there are multiselect variables with multiple selections
                        const multiselectVars = config.variables.filter(v => v.type === "multiselect")
                        const firstMultiselect = multiselectVars[0]
                        const selected = firstMultiselect && Array.isArray(variableValues[firstMultiselect.id]) 
                          ? variableValues[firstMultiselect.id] as string[]
                          : []
                        const hasMultipleSelections = selected.length > 1
                        
                        let previewLines: string[] = []
                        
                        if (hasMultipleSelections && firstMultiselect) {
                          // Generate preview for each selected multiselect value
                          selected.forEach(selectedValue => {
                            const tempValues = { ...variableValues, [firstMultiselect.id]: [selectedValue] }
                            const preview = generateFileName(tempValues)
                            if (preview) {
                              previewLines.push(preview)
                            }
                          })
                        } else {
                          // Single preview
                          const preview = generateFileName()
                          if (preview) {
                            previewLines = [preview]
                          }
                        }
                        
                        if (previewLines.length > 1) {
                          return (
                            <ScrollArea className="h-[120px] rounded-md border p-4">
                              <div className="font-mono text-sm space-y-1">
                                {previewLines.map((line, idx) => (
                                  <div key={idx}>{line}</div>
                                ))}
                              </div>
                            </ScrollArea>
                          )
                        }
                        
                        return (
                          <div className="h-10 rounded-md border px-4 flex items-center">
                            {previewLines.length > 0 ? (
                              <div className="font-mono text-sm truncate w-full">{previewLines[0]}</div>
                            ) : (
                              <div className="font-mono text-sm text-muted-foreground">
                                No file name generated yet
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <Button
                      onClick={handleGenerate}
                      disabled={!generateFileName()}
                      className="shrink-0"
                    >
                      Generate & Save
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {generatedNames.length > 0 ? (
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle>Generated Names ({generatedNames.length})</CardTitle>
                  <CardDescription>Click to copy or delete individual entries</CardDescription>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 rounded-md border p-4">
                {(() => {
                  // Group items by timestamp (items generated at the same time)
                  const grouped = currentItems.reduce((acc, entry, pageIndex) => {
                    const actualIndex = indexOfFirstItem + pageIndex
                    const timestamp = entry.timestamp
                    if (!acc[timestamp]) {
                      acc[timestamp] = []
                    }
                    acc[timestamp].push({ entry, actualIndex, pageIndex })
                    return acc
                  }, {} as Record<number, Array<{ entry: GeneratedName; actualIndex: number; pageIndex: number }>>)

                  // Render groups - use ItemGroup for items with same timestamp
                  return Object.entries(grouped).map(([timestamp, items]) => {
                    const isGroup = items.length > 1
                    const itemsToRender = items.map(({ entry, actualIndex }) => (
                      <Item
                        key={actualIndex}
                        variant="default"
                        size="sm"
                      >
                        <ItemContent>
                          <ItemTitle className="font-mono text-sm break-all">
                            {entry.fileName}
                          </ItemTitle>
                        </ItemContent>
                        <ItemActions>
                          <span className="text-xs text-muted-foreground mr-2">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                          {copiedIndex === actualIndex && (
                            <span className="text-xs text-muted-foreground mr-2">Copied!</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(entry.fileName, actualIndex)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(actualIndex)}
                            className="h-8 w-8 text-white hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </ItemActions>
                      </Item>
                    ))

                    if (isGroup) {
                      return (
                        <ItemGroup key={timestamp}>
                          {itemsToRender}
                        </ItemGroup>
                      )
                    }

                    return <div key={timestamp}>{itemsToRender}</div>
                  })
                })()}
              </ScrollArea>
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        
                        if (!showPage) {
                          // Show ellipsis
                          const prevPage = page - 1
                          const nextPage = page + 1
                          if (
                            (prevPage === 1 || prevPage === currentPage - 2) &&
                            (nextPage === totalPages || nextPage === currentPage + 2)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all generated names?</DialogTitle>
            <DialogDescription>
              This will permanently remove every saved file name. You'll need to re-enter your password to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClearAll}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              Please enter the password to generate or delete file names.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit()
                  }
                }}
                placeholder="Enter password"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false)
                setPassword("")
                setPendingAction(null)
                setPendingDeleteIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

