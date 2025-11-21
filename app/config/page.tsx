"use client"

import { useState, useEffect, useContext, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  DialogStack,
  DialogStackBody,
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackNext,
  DialogStackOverlay,
  DialogStackPrevious,
  DialogStackTitle,
  DialogStackTrigger,
} from "@/components/ui/shadcn-io/dialog-stack"
import { Trash2, Plus, Edit2, X as XIcon, GripVertical, Info, Lock, Unlock, Download, Upload, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { storage } from "@/lib/storage"
import type { Config, Variable, VariableType } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const STORAGE_KEY = "adtax-config"

// Validated Next Button for DialogStack
// Uses a hidden DialogStackNext button that we trigger programmatically after validation
function ValidatedNextButton({ onValidate }: { onValidate: () => boolean }) {
  const hiddenNextRef = useRef<HTMLButtonElement>(null)
  
  return (
    <>
      <DialogStackNext asChild>
        <button
          ref={hiddenNextRef}
          style={{ display: 'none' }}
          aria-hidden="true"
          tabIndex={-1}
        >
          Hidden Next
        </button>
      </DialogStackNext>
      <Button
        onClick={() => {
          if (onValidate() && hiddenNextRef.current) {
            // Trigger the hidden next button after validation passes
            hiddenNextRef.current.click()
          }
        }}
      >
        Next
      </Button>
    </>
  )
}

// Sortable item component
function SortableVariableItem({
  variable,
  onEdit,
  onDelete,
  onOpenDescriptions,
  variableDescription,
  optionDescriptions,
  locked = false,
}: {
  variable: Variable
  onEdit: (variable: Variable) => void
  onDelete: (id: string) => void
  onOpenDescriptions: (variable: Variable) => void
  variableDescription?: string
  optionDescriptions?: Record<string, string>
  locked?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 border rounded-md bg-background"
    >
      <div className="flex items-center gap-3 flex-1">
        {!locked && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <div className="font-medium">{variable.label}</div>
          <div className="text-sm text-muted-foreground">
            Type: {variable.type}
            {variable.values.length > 0 && (
              <span className="ml-2">
                • {variable.values.length} {variable.values.length === 1 ? "value" : "values"}
              </span>
            )}
          </div>
          {variable.values.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {variable.values.slice(0, 3).join(", ")}
              {variable.values.length > 3 && ` +${variable.values.length - 3} more`}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(variable.type === "dropdown" || variable.type === "multiselect" || variable.type === "input") && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={locked ? undefined : () => onOpenDescriptions(variable)}
                title={locked ? "View descriptions" : "Edit descriptions"}
                className={locked ? "cursor-default hover:bg-transparent hover:text-current" : ""}
              >
                <Info className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="top" align="end">
              <div className="space-y-3">
                {variableDescription ? (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Description</div>
                    <p className="text-sm">{variableDescription}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No description set</p>
                )}
                {optionDescriptions && Object.keys(optionDescriptions).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Option Descriptions</div>
                    <div className="space-y-2">
                      {Object.entries(optionDescriptions).slice(0, 5).map(([option, desc]) => (
                        desc && (
                          <div key={option} className="text-sm">
                            <span className="font-medium">{option}:</span>{" "}
                            <span className="text-muted-foreground">{desc}</span>
                          </div>
                        )
                      ))}
                      {Object.keys(optionDescriptions).length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{Object.keys(optionDescriptions).length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
        {!locked && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(variable)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(variable.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Variable Dialog Component - extracted to prevent recreation on every render
function VariableDialog({
  editingId,
  dialogOpen,
  setDialogOpen,
  setTempVariableId,
  setEditingId,
  handleAddVariable,
  formLabel,
  setFormLabel,
  formType,
  setFormType,
  formValues,
  setFormValues,
  formAllowFreeInput,
  setFormAllowFreeInput,
  handleNextToDescriptions,
  nextButtonRef,
  handleSaveVariable,
  tempVariableId,
  variableDescriptions,
  optionDescriptions,
  handleUpdateVariableDescription,
  handleUpdateOptionDescription,
}: {
  editingId: string | null
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  setTempVariableId: (id: string | null) => void
  setEditingId: (id: string | null) => void
  handleAddVariable: () => void
  formLabel: string
  setFormLabel: (label: string) => void
  formType: VariableType
  setFormType: (type: VariableType) => void
  formValues: string
  setFormValues: (values: string) => void
  formAllowFreeInput: boolean
  setFormAllowFreeInput: (allow: boolean) => void
  handleNextToDescriptions: () => boolean
  nextButtonRef: React.RefObject<HTMLButtonElement>
  handleSaveVariable: () => void
  tempVariableId: string | null
  variableDescriptions: Record<string, string>
  optionDescriptions: Record<string, Record<string, string>>
  handleUpdateVariableDescription: (variableId: string, description: string) => void
  handleUpdateOptionDescription: (variableId: string, option: string, description: string) => void
}) {
  // Ensure descriptions and formValues are always defined
  const safeVariableDescriptions = variableDescriptions || {}
  const safeOptionDescriptions = optionDescriptions || {}
  const safeFormValues = formValues || ""
  
  return (
    <DialogStack 
      key={editingId || "new"}
      open={dialogOpen} 
      onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setTempVariableId(null)
          setEditingId(null)
        }
      }}
    >
      {!editingId && (
        <DialogStackTrigger asChild>
          <Button onClick={handleAddVariable} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </DialogStackTrigger>
      )}
      <DialogStackOverlay />
      <DialogStackBody>
        <DialogStackContent>
          <DialogStackHeader>
            <DialogStackTitle>{editingId ? "Edit Variable" : "Add Variable"}</DialogStackTitle>
            <DialogStackDescription>
              {editingId ? "Update variable configuration" : "Configure basic variable information"}
            </DialogStackDescription>
          </DialogStackHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="var-label">Label</Label>
              <Input
                id="var-label"
                placeholder="e.g., Size, Persona, Funnel"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="var-type">Type</Label>
              <Select value={formType} onValueChange={(value) => setFormType(value as VariableType)}>
                <SelectTrigger id="var-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="multiselect">Multi-select</SelectItem>
                  <SelectItem value="input">Input Field</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formType === "dropdown" || formType === "multiselect") && (
              <div className="space-y-2">
                <Label htmlFor="var-values">Values (comma-separated)</Label>
                <Input
                  id="var-values"
                  placeholder="e.g., Option1, Option2, Option3"
                  value={formValues}
                  onChange={(e) => setFormValues(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter values separated by commas
                </p>
                {formType === "dropdown" && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="allow-free-input"
                      checked={formAllowFreeInput}
                      onCheckedChange={(checked) => setFormAllowFreeInput(checked === true)}
                    />
                    <Label
                      htmlFor="allow-free-input"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Allow free input
                    </Label>
                  </div>
                )}
              </div>
            )}

            {formType === "input" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Input fields allow free text entry and don&apos;t require predefined values
                </p>
              </div>
            )}
          </div>
          <DialogStackFooter className="justify-between">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {!editingId && (
                <ValidatedNextButton 
                  onValidate={handleNextToDescriptions}
                />
              )}
              {editingId && (
                <>
                  <DialogStackNext asChild>
                    <button
                      ref={nextButtonRef}
                      style={{ display: 'none' }}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      Hidden Next
                    </button>
                  </DialogStackNext>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (handleNextToDescriptions() && nextButtonRef.current) {
                        nextButtonRef.current.click()
                      }
                    }}
                  >
                    Next
                  </Button>
                </>
              )}
              {editingId && (
                <Button onClick={handleSaveVariable}>
                  Save Variable
                </Button>
              )}
            </div>
          </DialogStackFooter>
        </DialogStackContent>
        <DialogStackContent>
          <DialogStackHeader>
            <DialogStackTitle>Add Descriptions (Optional)</DialogStackTitle>
            <DialogStackDescription>
              Define descriptions for this variable and its options
            </DialogStackDescription>
          </DialogStackHeader>
          <div className="space-y-4 py-4">
            {(() => {
              const tempId = tempVariableId || `temp-${Date.now()}`
              const values = formType === "input" 
                ? [] 
                : safeFormValues.split(",").map(v => v.trim()).filter(Boolean)
              
              if (!tempId) return null
              
              return (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`var-desc-new-${tempId}`}>Description</Label>
                    <textarea
                      id={`var-desc-new-${tempId}`}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={`What does ${formLabel || "this variable"} mean to the final file name?`}
                      value={safeVariableDescriptions[tempId] || ""}
                      onChange={(e) => handleUpdateVariableDescription(tempId, e.target.value)}
                    />
                  </div>

                  {(formType === "dropdown" || formType === "multiselect") && values.length > 0 && (
                    <div className="space-y-3">
                      <Label>Option Descriptions</Label>
                      {values.map((option) => (
                        <div key={option} className="space-y-2">
                          <Label htmlFor={`desc-new-${tempId}-${option}`} className="text-sm font-normal">
                            {option}
                          </Label>
                          <Input
                            id={`desc-new-${tempId}-${option}`}
                            placeholder={`Description for ${option}`}
                            value={safeOptionDescriptions[tempId]?.[option] || ""}
                            onChange={(e) => handleUpdateOptionDescription(tempId, option, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
          <DialogStackFooter className="justify-between">
            <DialogStackPrevious asChild>
              <Button variant="outline">Previous</Button>
            </DialogStackPrevious>
            <Button onClick={handleSaveVariable}>
              {editingId ? "Save Variable" : "Create Variable"}
            </Button>
          </DialogStackFooter>
        </DialogStackContent>
      </DialogStackBody>
    </DialogStack>
  )
}

export default function ConfigPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasConfig, setHasConfig] = useState(false)
  const [variables, setVariables] = useState<Variable[]>([])
  const [caseTransform, setCaseTransform] = useState<"uppercase" | "lowercase" | "none">("lowercase")
  const [separator, setSeparator] = useState("_")
  const [locked, setLocked] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [descriptionsDialogOpen, setDescriptionsDialogOpen] = useState(false)
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null)
  const [tempVariableId, setTempVariableId] = useState<string | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [pendingAction, setPendingAction] = useState<"export" | "import" | "delete" | "unlock" | null>(null)
  const [lastExportTimestamp, setLastExportTimestamp] = useState<number | null>(null)
  const [lastModifiedTimestamp, setLastModifiedTimestamp] = useState<number | null>(null)
  const [importWarningDialogOpen, setImportWarningDialogOpen] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = useState(false)
  
  // Form state for new/editing variable
  const [formLabel, setFormLabel] = useState("")
  const [formType, setFormType] = useState<VariableType>("dropdown")
  const [formValues, setFormValues] = useState("")
  const [formAllowFreeInput, setFormAllowFreeInput] = useState(false)
  
  // State for editing select box options
  const [variableDescriptions, setVariableDescriptions] = useState<Record<string, string>>({})
  const [optionDescriptions, setOptionDescriptions] = useState<Record<string, Record<string, string>>>({})

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleEditVariable = (variable: Variable) => {
    setFormLabel(variable.label)
    setFormType(variable.type)
    // Filter out "{free_input}" from values when displaying
    const filteredValues = variable.values.filter(v => v !== "{free_input}")
    setFormValues(filteredValues.join(", "))
    setFormAllowFreeInput(variable.allowFreeInput || false)
    setEditingId(variable.id)
    // Load existing descriptions
    setVariableDescriptions(prev => ({
      ...prev,
      [variable.id]: variable.description || ""
    }))
    setOptionDescriptions(prev => ({
      ...prev,
      [variable.id]: variable.optionDescriptions || {}
    }))
    setTempVariableId(variable.id)
    setDialogOpen(true)
  }

  // Handle edit query parameter
  useEffect(() => {
    const editId = searchParams.get("edit")
    if (editId && variables.length > 0) {
      const variableToEdit = variables.find(v => v.id === editId)
      if (variableToEdit) {
        handleEditVariable(variableToEdit)
        // Clear the query param
        router.replace("/config")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, variables, router])

  // Load config from storage on mount
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true)
      // First, try to migrate from localStorage if it exists
      const localStored = localStorage.getItem(STORAGE_KEY)
      if (localStored) {
        try {
          const config: Config = JSON.parse(localStored)
          setVariables(config.variables || [])
          setCaseTransform(config.caseTransform || "lowercase")
          setSeparator(config.separator || "_")
          setLocked(config.locked || false)
          setHasConfig(true)
          // Initialize variable and option descriptions from variables
          const initialVarDescriptions: Record<string, string> = {}
          const initialOptionDescriptions: Record<string, Record<string, string>> = {}
          config.variables?.forEach(v => {
            if (v.type === "dropdown" || v.type === "multiselect" || v.type === "input") {
              initialVarDescriptions[v.id] = v.description || ""
              initialOptionDescriptions[v.id] = v.optionDescriptions || {}
            }
          })
          setVariableDescriptions(initialVarDescriptions)
          setOptionDescriptions(initialOptionDescriptions)
          // Migrate to KV storage
          await storage.set("config", config)
          // Clear localStorage after migration
          localStorage.removeItem(STORAGE_KEY)
          setLastModifiedTimestamp(Date.now())
          setIsLoading(false)
          return
        } catch (e) {
          console.error("Failed to parse localStorage config:", e)
        }
      }
      
      // Load from KV storage
      try {
        const stored = await storage.get<Config>("config")
        if (stored) {
          setVariables(stored.variables || [])
          setCaseTransform(stored.caseTransform || "lowercase")
          setSeparator(stored.separator || "_")
          setLocked(stored.locked || false)
          setHasConfig(true)
          // Initialize variable and option descriptions from variables
          const initialVarDescriptions: Record<string, string> = {}
          const initialOptionDescriptions: Record<string, Record<string, string>> = {}
          stored.variables?.forEach(v => {
            if (v.type === "dropdown" || v.type === "multiselect" || v.type === "input") {
              initialVarDescriptions[v.id] = v.description || ""
              initialOptionDescriptions[v.id] = v.optionDescriptions || {}
            }
          })
          setVariableDescriptions(initialVarDescriptions)
          setOptionDescriptions(initialOptionDescriptions)
          setLastModifiedTimestamp(Date.now())
        } else {
          setHasConfig(false)
        }
      } catch (e) {
        console.error("Failed to load config:", e)
        setHasConfig(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadConfig()
  }, [])

  // Update variable descriptions when variables change
  useEffect(() => {
    const newVarDescriptions: Record<string, string> = {}
    const newOptionDescriptions: Record<string, Record<string, string>> = {}
    variables.forEach(v => {
      if (v.type === "dropdown" || v.type === "multiselect" || v.type === "input") {
        setVariableDescriptions(prev => {
          if (!prev[v.id]) {
            return { ...prev, [v.id]: v.description || "" }
          }
          return prev
        })
        setOptionDescriptions(prev => {
          if (!prev[v.id]) {
            return { ...prev, [v.id]: v.optionDescriptions || {} }
          }
          return prev
        })
      }
    })
  }, [variables])

  const saveConfig = async (vars?: Variable[], transform?: typeof caseTransform, sep?: string, isLocked?: boolean): Promise<boolean> => {
    const config: Config = {
      variables: vars ?? variables,
      caseTransform: transform ?? caseTransform,
      separator: sep ?? separator,
      locked: isLocked !== undefined ? isLocked : locked
    }
    try {
      await storage.set("config", config)
      setHasConfig(true)
      setLastModifiedTimestamp(Date.now())
      return true
    } catch (error) {
      console.error("Failed to save config:", error)
      toast.error("Failed to save config")
      return false
    }
  }

  const handleAddVariable = () => {
    setFormLabel("")
    setFormType("dropdown")
    setFormValues("")
    setFormAllowFreeInput(false)
    setEditingId(null)
    const newTempId = `temp-${Date.now()}`
    setTempVariableId(newTempId)
    // Initialize empty descriptions for new variable
    setVariableDescriptions(prev => ({ ...prev, [newTempId]: "" }))
    setOptionDescriptions(prev => ({ ...prev, [newTempId]: {} }))
    setDialogOpen(true)
  }

  const handleSaveVariable = async () => {
    if (!formLabel.trim()) {
      toast.error("Label is required")
      return
    }

    const values = formType === "input" 
      ? [] 
      : (formValues || "").split(",").map(v => v.trim()).filter(Boolean).filter(v => v !== "{free_input}")

    if ((formType === "dropdown" || formType === "multiselect") && values.length === 0 && !formAllowFreeInput) {
      toast.error("At least one value is required for dropdown/multi-select, or enable free input")
      return
    }

    const newVariableId = editingId || Date.now().toString()
    const tempId = tempVariableId || newVariableId
    const varDescription = variableDescriptions[tempId] || ""
    const optionDescs = optionDescriptions[tempId] || {}
    
    // Clean up temp descriptions
    if (tempVariableId) {
      setVariableDescriptions(prev => {
        const next = { ...prev }
        delete next[tempVariableId]
        return next
      })
      setOptionDescriptions(prev => {
        const next = { ...prev }
        delete next[tempVariableId]
        return next
      })
      setTempVariableId(null)
    }

    const newVariable: Variable = {
      id: newVariableId,
      label: formLabel.trim(),
      type: formType,
      values,
      description: varDescription,
      optionDescriptions: optionDescs,
      allowFreeInput: formType === "dropdown" ? formAllowFreeInput : undefined
    }

    if (editingId) {
      const updated = variables.map(v => v.id === editingId ? newVariable : v)
      setVariables(updated)
      await saveConfig(updated)
      toast.success("Variable updated")
    } else {
      const updated = [...variables, newVariable]
      setVariables(updated)
      await saveConfig(updated)
      setHasConfig(true)
      toast.success("Variable added")
    }

    setDialogOpen(false)
    setTempVariableId(null)
  }

  const handleNextToDescriptions = (): boolean => {
    // Validate basic info before moving to descriptions
    if (!formLabel.trim()) {
      toast.error("Label is required")
      return false
    }

    const values = formType === "input" 
      ? [] 
      : (formValues || "").split(",").map(v => v.trim()).filter(Boolean)

    if ((formType === "dropdown" || formType === "multiselect") && values.length === 0) {
      toast.error("At least one value is required for dropdown/multi-select")
      return false
    }

    // Ensure tempId is set
    if (!tempVariableId) {
      const newTempId = `temp-${Date.now()}`
      setTempVariableId(newTempId)
      if (!variableDescriptions[newTempId]) {
        setVariableDescriptions(prev => ({ ...prev, [newTempId]: "" }))
      }
      if (!optionDescriptions[newTempId]) {
        setOptionDescriptions(prev => ({ ...prev, [newTempId]: {} }))
      }
    }
    
    return true
  }

  const handleDeleteVariable = async (id: string) => {
    const updated = variables.filter(v => v.id !== id)
    setVariables(updated)
    await saveConfig(updated)
    toast.success("Variable deleted")
  }

  const handleCaseTransformChange = async (value: string) => {
    const transform = value as "uppercase" | "lowercase" | "none"
    setCaseTransform(transform)
    await saveConfig(undefined, transform)
  }

  const handleSeparatorChange = async (value: string) => {
    setSeparator(value)
    await saveConfig(undefined, undefined, value)
  }

  const handleToggleLock = async () => {
    // Locking doesn't require password, only unlocking does
    if (!locked) {
      // Lock immediately
      setLocked(true)
      await saveConfig(undefined, undefined, undefined, true)
      toast.success("Configuration locked")
    } else {
      // Unlocking requires password
      setPendingAction("unlock")
      setPasswordDialogOpen(true)
    }
  }

  const checkPasswordAndExecute = (action: "export" | "import" | "delete" | "unlock") => {
    setPendingAction(action)
    setPasswordDialogOpen(true)
  }

  const executePendingAction = async () => {
    if (pendingAction === "export") {
      performExport()
    } else if (pendingAction === "import") {
      performImportClick()
    } else if (pendingAction === "delete") {
      setDeleteConfigDialogOpen(true)
    } else if (pendingAction === "unlock") {
      setLocked(false)
      await saveConfig(undefined, undefined, undefined, false)
      toast.success("Configuration unlocked")
    }
    setPendingAction(null)
  }

  const handlePasswordSubmit = async () => {
    // Get password from environment variable (falls back to default for development)
    const correctPassword = process.env.NEXT_PUBLIC_LOCK_PASSWORD || "signboards"
    
    if (password === correctPassword) {
      setPasswordDialogOpen(false)
      setPassword("")
      await executePendingAction()
    } else {
      toast.error("Incorrect password")
      setPassword("")
    }
  }

  const handleUpdateVariableDescription = (variableId: string, description: string) => {
    setVariableDescriptions(prev => ({ ...prev, [variableId]: description }))
  }

  const handleUpdateOptionDescription = (variableId: string, option: string, description: string) => {
    setOptionDescriptions(prev => ({
      ...prev,
      [variableId]: {
        ...(prev[variableId] || {}),
        [option]: description
      }
    }))
  }

  const handleOpenDescriptions = (variable: Variable) => {
    setEditingVariable(variable)
    // Initialize descriptions if not already set
    if (!variableDescriptions[variable.id]) {
      setVariableDescriptions(prev => ({ ...prev, [variable.id]: variable.description || "" }))
    }
    if (!optionDescriptions[variable.id]) {
      setOptionDescriptions(prev => ({ ...prev, [variable.id]: variable.optionDescriptions || {} }))
    }
    setDescriptionsDialogOpen(true)
  }

  const handleSaveOptions = async () => {
    if (!editingVariable) return
    
    const variableId = editingVariable.id
    const varDescription = variableDescriptions[variableId] || ""
    const optionDescs = optionDescriptions[variableId] || {}
    
    const updated = variables.map(v => 
      v.id === variableId 
        ? { 
            ...v, 
            description: varDescription,
            optionDescriptions: optionDescs
          }
        : v
    )
    setVariables(updated)
    await saveConfig(updated)
    toast.success("Descriptions updated")
    setDescriptionsDialogOpen(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = variables.findIndex((v) => v.id === active.id)
      const newIndex = variables.findIndex((v) => v.id === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        console.error("Invalid drag indices")
        return
      }

      // Store original order for potential revert
      const originalOrder = [...variables]
      const reordered = arrayMove(variables, oldIndex, newIndex)
      setVariables(reordered)
      
      const success = await saveConfig(reordered)
      if (!success) {
        // Revert to original order on error
        setVariables(originalOrder)
      }
    }
  }

  const handleExportConfig = () => {
    checkPasswordAndExecute("export")
  }

  const performExport = () => {
    const config: Config = {
      variables,
      caseTransform,
      separator,
      locked
    }
    const json = JSON.stringify(config, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `adtax-config-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setLastExportTimestamp(Date.now())
    toast.success("Configuration exported")
  }

  const handleImportClick = () => {
    checkPasswordAndExecute("import")
  }

  const performImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if there are unsaved changes
    const hasUnsavedChanges = lastExportTimestamp !== null && 
                              lastModifiedTimestamp !== null && 
                              lastModifiedTimestamp > lastExportTimestamp

    if (hasUnsavedChanges) {
      // Show warning dialog
      setPendingImportFile(file)
      setImportWarningDialogOpen(true)
    } else {
      // No unsaved changes, proceed with import
      performImport(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const performImport = async (file: File) => {
    try {
      const text = await file.text()
      const config: Config = JSON.parse(text)
      
      // Validate config structure
      if (!config || typeof config !== "object") {
        throw new Error("Invalid configuration file")
      }

      // Validate and set config
      setVariables(config.variables || [])
      setCaseTransform(config.caseTransform || "lowercase")
      setSeparator(config.separator || "_")
      setLocked(config.locked || false)
      setHasConfig(true)

      // Initialize descriptions
      const initialVarDescriptions: Record<string, string> = {}
      const initialOptionDescriptions: Record<string, Record<string, string>> = {}
      config.variables?.forEach(v => {
        if (v.type === "dropdown" || v.type === "multiselect" || v.type === "input") {
          initialVarDescriptions[v.id] = v.description || ""
          initialOptionDescriptions[v.id] = v.optionDescriptions || {}
        }
      })
      setVariableDescriptions(initialVarDescriptions)
      setOptionDescriptions(initialOptionDescriptions)

      // Save to storage
      await saveConfig(config.variables, config.caseTransform, config.separator, config.locked)
      setLastExportTimestamp(null) // Reset export timestamp since we imported
      toast.success("Configuration imported")
    } catch (error) {
      console.error("Failed to import config:", error)
      toast.error("Failed to import configuration. Please check the file format.")
    }
  }

  const handleImportWithExport = async () => {
    // Export first, then import
    handleExportConfig()
    // Small delay to ensure export completes
    await new Promise(resolve => setTimeout(resolve, 500))
    if (pendingImportFile) {
      await performImport(pendingImportFile)
    }
    setImportWarningDialogOpen(false)
    setPendingImportFile(null)
  }

  const handleImportWithoutExport = async () => {
    // Import without exporting
    if (pendingImportFile) {
      await performImport(pendingImportFile)
    }
    setImportWarningDialogOpen(false)
    setPendingImportFile(null)
  }

  const handleDeleteConfig = async () => {
    try {
      await storage.delete("config")
      setVariables([])
      setCaseTransform("lowercase")
      setSeparator("_")
      setLocked(false)
      setHasConfig(false)
      setLastExportTimestamp(null)
      setLastModifiedTimestamp(null)
      setVariableDescriptions({})
      setOptionDescriptions({})
      toast.success("Configuration deleted")
      setDeleteConfigDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete config:", error)
      toast.error("Failed to delete configuration")
    }
  }

  const handleCreateFirstConfig = () => {
    handleAddVariable()
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">Loading configuration...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render no config state
  if (!hasConfig) {
    return (
      <>
        <div className="min-h-screen bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="text-muted-foreground mb-6">
                    No configuration available. Create your first configuration to get started.
                  </div>
                  <Button onClick={handleCreateFirstConfig}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <VariableDialog
          editingId={editingId}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          setTempVariableId={setTempVariableId}
          setEditingId={setEditingId}
          handleAddVariable={handleAddVariable}
          formLabel={formLabel}
          setFormLabel={setFormLabel}
          formType={formType}
          setFormType={setFormType}
          formValues={formValues}
          setFormValues={setFormValues}
          formAllowFreeInput={formAllowFreeInput}
          setFormAllowFreeInput={setFormAllowFreeInput}
          handleNextToDescriptions={handleNextToDescriptions}
          nextButtonRef={nextButtonRef}
          handleSaveVariable={handleSaveVariable}
          tempVariableId={tempVariableId}
          variableDescriptions={variableDescriptions}
          optionDescriptions={optionDescriptions}
          handleUpdateVariableDescription={handleUpdateVariableDescription}
          handleUpdateOptionDescription={handleUpdateOptionDescription}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 pb-4 md:pb-8 pt-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Configure variables and formatting options for the file name generator
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">
                  {locked ? "Locked" : "Unlocked"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleLock}
                  className="transition-all duration-200"
                  title={locked ? "Unlock configuration" : "Lock configuration"}
                >
                  {locked ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Unlock className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Variables</Label>
                {!locked && (
                  <VariableDialog
                    editingId={editingId}
                    dialogOpen={dialogOpen}
                    setDialogOpen={setDialogOpen}
                    setTempVariableId={setTempVariableId}
                    setEditingId={setEditingId}
                    handleAddVariable={handleAddVariable}
                    formLabel={formLabel}
                    setFormLabel={setFormLabel}
                    formType={formType}
                    setFormType={setFormType}
                    formValues={formValues}
                    setFormValues={setFormValues}
                    formAllowFreeInput={formAllowFreeInput}
                    setFormAllowFreeInput={setFormAllowFreeInput}
                    handleNextToDescriptions={handleNextToDescriptions}
                    nextButtonRef={nextButtonRef}
                    handleSaveVariable={handleSaveVariable}
                    tempVariableId={tempVariableId}
                    variableDescriptions={variableDescriptions}
                    optionDescriptions={optionDescriptions}
                    handleUpdateVariableDescription={handleUpdateVariableDescription}
                    handleUpdateOptionDescription={handleUpdateOptionDescription}
                  />
                )}
              </div>

              {variables.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  No variables configured. Click &quot;Add Variable&quot; to get started.
                </div>
              ) : locked ? (
                <div className="space-y-2">
                  {variables.map((variable) => {
                    const varDesc = variableDescriptions[variable.id] || variable.description || ""
                    const optionDescs = optionDescriptions[variable.id] || variable.optionDescriptions || {}
                    return (
                      <SortableVariableItem
                        key={variable.id}
                        variable={variable}
                        onEdit={handleEditVariable}
                        onDelete={handleDeleteVariable}
                        onOpenDescriptions={handleOpenDescriptions}
                        variableDescription={varDesc}
                        optionDescriptions={optionDescs}
                        locked={locked}
                      />
                    )
                  })}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={variables.map((v) => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {variables.map((variable) => {
                        const varDesc = variableDescriptions[variable.id] || variable.description || ""
                        const optionDescs = optionDescriptions[variable.id] || variable.optionDescriptions || {}
                        return (
                          <SortableVariableItem
                            key={variable.id}
                            variable={variable}
                            onEdit={handleEditVariable}
                            onDelete={handleDeleteVariable}
                            onOpenDescriptions={handleOpenDescriptions}
                            variableDescription={varDesc}
                            optionDescriptions={optionDescs}
                            locked={locked}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Formatting Options */}
            <div className="border-t pt-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Formatting Options</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-transform">Case Transformation</Label>
                    <Select value={caseTransform} onValueChange={handleCaseTransformChange} disabled={locked}>
                      <SelectTrigger id="case-transform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uppercase">Uppercase</SelectItem>
                        <SelectItem value="lowercase">Lowercase</SelectItem>
                        <SelectItem value="none">None (preserve original)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How to transform the case of variable values in the file name
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="separator">Separator Character</Label>
                    <Input
                      id="separator"
                      placeholder="_"
                      value={separator}
                      onChange={(e) => handleSeparatorChange(e.target.value)}
                      maxLength={1}
                      disabled={locked}
                    />
                    <p className="text-xs text-muted-foreground">
                      Character used to separate words in the file name
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export/Import/Delete Actions */}
        <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportConfig}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportClick}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => checkPasswordAndExecute("delete")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Configuration
                </Button>
              </div>
            </div>

      {/* Password Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
              setPasswordDialogOpen(open)
              if (!open) {
                setPassword("")
                setPendingAction(null)
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {pendingAction === "unlock" ? "Unlock Configuration" : 
                     pendingAction === "export" ? "Export Configuration" :
                     pendingAction === "import" ? "Import Configuration" :
                     pendingAction === "delete" ? "Delete Configuration" :
                     "Enter Password"}
                  </DialogTitle>
                  <DialogDescription>
                    {pendingAction === "unlock" ? "Enter password to unlock the configuration" :
                     pendingAction === "export" ? "Enter password to export the configuration" :
                     pendingAction === "import" ? "Enter password to import a configuration" :
                     pendingAction === "delete" ? "Enter password to delete the configuration" :
                     "Enter password to continue"}
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setPasswordDialogOpen(false)
                    setPassword("")
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handlePasswordSubmit}>
                    {locked ? "Unlock" : "Lock"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Warning Dialog */}
            <Dialog open={importWarningDialogOpen} onOpenChange={setImportWarningDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Configuration</DialogTitle>
                  <DialogDescription>
                    You have unsaved changes that will be lost if you import a new configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Your current configuration has been modified since the last export. 
                    Would you like to export it first before importing the new configuration?
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setImportWarningDialogOpen(false)
                      setPendingImportFile(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleImportWithoutExport}
                  >
                    Import Without Exporting
                  </Button>
                  <Button onClick={handleImportWithExport}>
                    Export First, Then Import
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Descriptions Dialog */}
            <Dialog open={descriptionsDialogOpen} onOpenChange={setDescriptionsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Edit Descriptions - {editingVariable?.label}
                  </DialogTitle>
                  <DialogDescription>
                    Define descriptions for this variable and its options
                  </DialogDescription>
                </DialogHeader>
                {editingVariable && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor={`var-desc-${editingVariable.id}`}>Description</Label>
                      <textarea
                        id={`var-desc-${editingVariable.id}`}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={`What does ${editingVariable.label.toLowerCase()} mean to the final file name?`}
                        value={variableDescriptions[editingVariable.id] || editingVariable.description || ""}
                        onChange={(e) => handleUpdateVariableDescription(editingVariable.id, e.target.value)}
                      />
                    </div>

                    {editingVariable.type !== "input" && editingVariable.values.length > 0 && (
                      <div className="space-y-3">
                        <Label>Option Descriptions</Label>
                        {editingVariable.values.map((option) => (
                          <div key={option} className="space-y-2">
                            <Label htmlFor={`desc-${editingVariable.id}-${option}`} className="text-sm font-normal">
                              {option}
                            </Label>
                            <Input
                              id={`desc-${editingVariable.id}-${option}`}
                              placeholder={`Description for ${option}`}
                              value={optionDescriptions[editingVariable.id]?.[option] || ""}
                              onChange={(e) => handleUpdateOptionDescription(editingVariable.id, option, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setDescriptionsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveOptions}>
                        Save Descriptions
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
      </div>
    </div>
  )
}

