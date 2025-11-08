export type VariableType = "dropdown" | "multiselect" | "input"

export interface Variable {
  id: string
  label: string
  type: VariableType
  values: string[]
  description?: string
  optionDescriptions?: Record<string, string>
  allowFreeInput?: boolean
}

export interface Config {
  variables: Variable[]
  caseTransform: "uppercase" | "lowercase" | "none"
  separator: string
  locked?: boolean
}

