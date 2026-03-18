import { cryptoToolHandlers } from '../toolHandlers/cryptoTools.js'
import { dateToolHandlers } from '../toolHandlers/dateTools.js'
import { devToolHandlers } from '../toolHandlers/devTools.js'
import { documentToolHandlers } from '../toolHandlers/documentTools.js'
import { encodingToolHandlers } from '../toolHandlers/encodingTools.js'
import { fileToolHandlers } from '../toolHandlers/fileTools.js'
import { formatToolHandlers } from '../toolHandlers/formatTools.js'
import { imageToolHandlers } from '../toolHandlers/imageTools.js'
import { networkToolHandlers } from '../toolHandlers/networkTools.js'
import { textToolHandlers } from '../toolHandlers/textTools.js'
import type { ToolHandler } from '../../shared/types.js'

export const handlers: Record<string, ToolHandler> = {
  ...formatToolHandlers,
  ...encodingToolHandlers,
  ...cryptoToolHandlers,
  ...devToolHandlers,
  ...textToolHandlers,
  ...imageToolHandlers,
  ...documentToolHandlers,
  ...fileToolHandlers,
  ...dateToolHandlers,
  ...networkToolHandlers,
}
