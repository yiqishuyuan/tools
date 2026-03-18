import { flatToolCatalog } from '../../data/toolCatalog.js'
import { handlers } from './registry.js'
import type { ToolExecutionResult } from '../../shared/types.js'

function getToolById(toolId: string) {
  return flatToolCatalog.find((tool) => tool.id === toolId) ?? null
}

export function listCatalog() {
  return flatToolCatalog
}

export function listImplementedToolIds() {
  return Object.keys(handlers)
}

export async function executeTool(
  toolId: string,
  input: unknown,
  options: Record<string, unknown> = {},
): Promise<ToolExecutionResult> {
  const tool = getToolById(toolId)
  if (!tool) {
    const error = new Error(`Unknown toolId: ${toolId}`)
    ;(error as any).statusCode = 404
    throw error
  }

  const handler = handlers[toolId]
  if (!handler) {
    const error = new Error(`Tool "${tool.name}" is not implemented in back_end yet.`)
    ;(error as any).statusCode = 501
    throw error
  }

  const result = (await handler(input as string, options)) as ToolExecutionResult | unknown
  if (
    result &&
    typeof result === 'object' &&
    ('output' in (result as Record<string, unknown>) ||
      'file' in (result as Record<string, unknown>) ||
      'previewImage' in (result as Record<string, unknown>))
  ) {
    return {
      toolId,
      name: tool.name,
      ...(result as Record<string, unknown>),
    } as unknown as ToolExecutionResult
  }

  return {
    toolId,
    name: tool.name,
    output: result,
  } as unknown as ToolExecutionResult
}

