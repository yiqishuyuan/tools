export interface BackendFileResult {
  filename: string
  mimeType: string
  contentBase64: string
  message?: string
}

export interface ToolExecutionResult {
  output?: unknown
  previewImage?: string
  file?: BackendFileResult
}

export interface ToolExecutionInput {
  input: string
  options?: Record<string, unknown>
}

export type ToolHandler = (
  input: string,
  options?: Record<string, unknown>,
) => Promise<ToolExecutionResult | unknown> | ToolExecutionResult | unknown

