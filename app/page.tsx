"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { MediaIdNavigator } from "@/components/MediaIdNavigator"

const SIZE_OPTIONS = ["9x16", "4x5", "1x1", "9x16_video", "1x1_video"]
const PERSONA_OPTIONS = ["CREATOR", "AGENCY", "BUSINESS"]
const FUNNEL_OPTIONS = ["COLD", "WARM", "HOT"]
const ARCHETYPE_OPTIONS = [
  "PROBLEM_SOLUTION",
  "PROOF",
  "TESTIMONIAL",
  "DEMO",
  "COMPARISON",
  "TRANSFORMATION",
  "EDUCATIONAL",
  "FEATURE",
  "BENEFITS",
  "MEME_CULTURAL",
  "CONTRARIAN",
  "STORY",
  "REACTION",
  "BREAKDOWN",
  "LISTICLE"
]
const HOOK_OPTIONS = ["PAIN", "CURIOSITY", "BOLD_CLAIM", "PATTERN", "EMOTIONAL", "PROOF"]
const CTA_OPTIONS = ["TRIAL", "DEMO", "OPS_AUDIT", "WAITLIST", "LEARN_MORE"]
const STYLE_OPTIONS = ["HIFI", "LOFI", "PRODUCT", "BRANDED", "LIFE"]

const STORAGE_KEY = "adtax-generated-names"

interface GeneratedName {
  fileName: string
  metadata: {
    size: string
    persona: string
    funnel: string
    archetype: string
    hook: string
    adDescription: string
    cta: string
    style: string
    variation: string
  }
  timestamp: number
}

export default function Home() {
  const [sizes, setSizes] = useState<string[]>([])
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false)
  const [persona, setPersona] = useState("")
  const [funnel, setFunnel] = useState("")
  const [archetype, setArchetype] = useState("")
  const [hook, setHook] = useState("")
  const [adDescription, setAdDescription] = useState("")
  const [cta, setCta] = useState("")
  const [style, setStyle] = useState("")
  const [variation, setVariation] = useState("")
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const parseFileName = (fileName: string): GeneratedName['metadata'] => {
    const parts = fileName.split('_')
    // Order: size, persona, funnel, archetype, hook, adDescription, cta, style, variation
    return {
      size: parts[0] || '',
      persona: parts[1] || '',
      funnel: parts[2] || '',
      archetype: parts[3] || '',
      hook: parts[4] || '',
      adDescription: parts[5] || '',
      cta: parts[6] || '',
      style: parts[7] || '',
      variation: parts.slice(8).join('_') || ''
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Handle migration from old string[] format
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setGeneratedNames([])
          } else if (typeof parsed[0] === 'string') {
            // Old format - convert to new format
            const migrated: GeneratedName[] = parsed.map((fileName: string) => ({
              fileName,
              metadata: parseFileName(fileName),
              timestamp: Date.now()
            }))
            setGeneratedNames(migrated)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
          } else {
            // New format - validate structure
            const validEntries = parsed.filter((entry: any) => 
              entry && typeof entry === 'object' && entry.fileName && entry.metadata
            )
            setGeneratedNames(validEntries)
          }
        }
      } catch (e) {
        console.error("Failed to load stored names:", e)
        setGeneratedNames([])
      }
    }
  }, [])

  const generateFileName = (sizeValue: string) => {
    const parts = [
      sizeValue,
      persona,
      funnel,
      archetype,
      hook,
      adDescription.trim().replace(/\s+/g, "_"),
      cta,
      style,
      variation.trim().replace(/\s+/g, "_")
    ].filter(Boolean).map(part => part.toLowerCase())

    if (parts.length === 0) return ""

    return parts.join("_")
  }

  const handleGenerate = async () => {
    const selectedSizes = sizes.length > 0 ? sizes : [""]
    const newEntries: GeneratedName[] = []

    for (const sizeValue of selectedSizes) {
      const fileName = generateFileName(sizeValue)
      if (fileName) {
        newEntries.push({
          fileName,
          metadata: {
            size: sizeValue.toLowerCase(),
            persona: persona.toLowerCase(),
            funnel: funnel.toLowerCase(),
            archetype: archetype.toLowerCase(),
            hook: hook.toLowerCase(),
            adDescription: adDescription.trim().replace(/\s+/g, "_").toLowerCase(),
            cta: cta.toLowerCase(),
            style: style.toLowerCase(),
            variation: variation.trim().replace(/\s+/g, "_").toLowerCase()
          },
          timestamp: Date.now()
        })
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const toggleSize = (sizeValue: string) => {
    setSizes(prev => 
      prev.includes(sizeValue)
        ? prev.filter(s => s !== sizeValue)
        : [...prev, sizeValue]
    )
  }

  // Reusable multi-select combobox renderer
  const renderMultiSelect = (
    label: string,
    id: string,
    options: string[],
    selected: string[],
    onToggle: (value: string) => void,
    open: boolean,
    onOpenChange: (open: boolean) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length === 0 
              ? `Select ${label.toLowerCase()}` 
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
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => onToggle(option)}
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
  )

  const handleCopy = async (fileName: string, index: number) => {
    await navigator.clipboard.writeText(fileName)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleDelete = (index: number) => {
    const updated = generatedNames.filter((_, i) => i !== index)
    setGeneratedNames(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    // Reset to first page if current page becomes empty
    const totalPages = Math.ceil(updated.length / itemsPerPage)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }

  // Analytics/Reporting functions
  const getStats = () => {
    const stats = {
      total: generatedNames.length,
      byFunnel: {} as Record<string, number>,
      byPersona: {} as Record<string, number>,
      byArchetype: {} as Record<string, number>,
      byHook: {} as Record<string, number>,
      byCta: {} as Record<string, number>,
      byStyle: {} as Record<string, number>,
      bySize: {} as Record<string, number>
    }

    generatedNames.forEach(entry => {
      if (entry.metadata.funnel) {
        stats.byFunnel[entry.metadata.funnel] = (stats.byFunnel[entry.metadata.funnel] || 0) + 1
      }
      if (entry.metadata.persona) {
        stats.byPersona[entry.metadata.persona] = (stats.byPersona[entry.metadata.persona] || 0) + 1
      }
      if (entry.metadata.archetype) {
        stats.byArchetype[entry.metadata.archetype] = (stats.byArchetype[entry.metadata.archetype] || 0) + 1
      }
      if (entry.metadata.hook) {
        stats.byHook[entry.metadata.hook] = (stats.byHook[entry.metadata.hook] || 0) + 1
      }
      if (entry.metadata.cta) {
        stats.byCta[entry.metadata.cta] = (stats.byCta[entry.metadata.cta] || 0) + 1
      }
      if (entry.metadata.style) {
        stats.byStyle[entry.metadata.style] = (stats.byStyle[entry.metadata.style] || 0) + 1
      }
      if (entry.metadata.size) {
        stats.bySize[entry.metadata.size] = (stats.bySize[entry.metadata.size] || 0) + 1
      }
    })

    return stats
  }

  const handleClearAll = () => {
    setGeneratedNames([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const previewFileNames = sizes.length > 0 
    ? sizes.map(size => generateFileName(size)).filter(Boolean)
    : [generateFileName("")].filter(Boolean)

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-6 gap-4">
          <MediaIdNavigator />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Meta Ad File Name Generator</CardTitle>
            <CardDescription>Configure your ad parameters to generate a file name</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {renderMultiSelect(
                  "Size",
                  "size",
                  SIZE_OPTIONS,
                  sizes,
                  toggleSize,
                  sizePopoverOpen,
                  setSizePopoverOpen
                )}

                <div className="space-y-2">
                  <Label htmlFor="persona">Persona</Label>
                  <Select value={persona} onValueChange={(value) => setPersona(value === "none" ? "" : value)}>
                    <SelectTrigger id="persona">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {PERSONA_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="funnel">Funnel</Label>
                  <Select value={funnel} onValueChange={(value) => setFunnel(value === "none" ? "" : value)}>
                    <SelectTrigger id="funnel">
                      <SelectValue placeholder="Select funnel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {FUNNEL_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="archetype">Archetype</Label>
                  <Select value={archetype} onValueChange={(value) => setArchetype(value === "none" ? "" : value)}>
                    <SelectTrigger id="archetype">
                      <SelectValue placeholder="Select archetype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ARCHETYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hook">Hook</Label>
                  <Select value={hook} onValueChange={(value) => setHook(value === "none" ? "" : value)}>
                    <SelectTrigger id="hook">
                      <SelectValue placeholder="Select hook" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {HOOK_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta">CTA</Label>
                  <Select value={cta} onValueChange={(value) => setCta(value === "none" ? "" : value)}>
                    <SelectTrigger id="cta">
                      <SelectValue placeholder="Select CTA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CTA_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={(value) => setStyle(value === "none" ? "" : value)}>
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {STYLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adDescription">Ad Description</Label>
                  <Input
                    id="adDescription"
                    placeholder="Enter ad description"
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variation">Variation</Label>
                  <Input
                    id="variation"
                    placeholder="Enter variation"
                    value={variation}
                    onChange={(e) => setVariation(e.target.value)}
                  />
                </div>
              </div>
            </form>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  {previewFileNames.length > 0 ? (
                    previewFileNames.map((name, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-md font-mono text-sm">
                        {name}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-muted rounded-md font-mono text-sm text-muted-foreground">
                      No file name generated yet
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={previewFileNames.length === 0}
                  className="shrink-0"
                >
                  Generate & Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {generatedNames.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated File Names ({generatedNames.length})</CardTitle>
                  <CardDescription>Click to copy or delete individual entries</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
            <CardContent>
              <div className="space-y-2">
                {currentItems.map((entry, pageIndex) => {
                  const actualIndex = indexOfFirstItem + pageIndex
                  return (
                    <div
                      key={actualIndex}
                      className="flex items-center gap-2 p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <code className="flex-1 font-mono text-sm">{entry.fileName}</code>
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
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {copiedIndex === actualIndex && (
                        <span className="text-xs text-muted-foreground">Copied!</span>
                      )}
                    </div>
                  )
                })}
              </div>
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
    </div>
  )
}

