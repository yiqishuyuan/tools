import request from '../utils/request/request'
import type {
  ToolExecutionPayload,
  ToolExecutionResult,
} from '../utils/toolExecutor'
import type { ToolDefinition } from '../utils/toolCatalog'

type ExecuteToolResponse = {
  ok: boolean
  message?: string
  output?: unknown
  previewImage?: string
  file?: {
    filename: string
    mimeType: string
    contentBase64: string
  }
}

export async function executeBackendTool(
  tool: ToolDefinition,
  payload: ToolExecutionPayload,
): Promise<ToolExecutionResult> {
  const response = await request.post<ExecuteToolResponse>('/api/execute', {
    toolId: tool.id,
    input:
      tool.mode === 'compare'
        ? { left: payload.input, right: payload.secondaryInput }
        : payload.input,
    options: payload.options,
  })

  const data = response.data
  if (!data.ok) {
    throw new Error(data.message || `${tool.name} 调用 back_end 失败`)
  }

  return {
    output:
      typeof data.output === 'string'
        ? data.output
        : JSON.stringify(data.output ?? '', null, 2),
    previewImage: data.previewImage,
    downloadFile: data.file,
  }
}
