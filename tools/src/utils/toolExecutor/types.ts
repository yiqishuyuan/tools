export type ToolExecutionPayload = {
  input: string
  secondaryInput: string
  options: Record<string, unknown>
}

export type ToolExecutionResult = {
  output: string
  copyText?: string
  previewImage?: string
  downloadFile?: {
    filename: string
    mimeType: string
    contentBase64: string
  }
}

export type ExecutorFn = (
  payload: ToolExecutionPayload,
) => ToolExecutionResult | Promise<ToolExecutionResult>
