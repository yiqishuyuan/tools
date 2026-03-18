import {
  azw3ToPdf,
  docxToPdf,
  epubToPdf,
  pdfToAzw3,
  pdfToDocx,
  pdfToEpub,
  pdfToTxt,
  txtToPdf,
} from '../document/index.js'
import type { ToolHandler } from '../../shared/types.js'

export const documentToolHandlers: Record<string, ToolHandler> = {
  'epub-to-pdf': (_input, options) => epubToPdf(options),
  'pdf-to-epub': (_input, options) => pdfToEpub(options),
  'azw3-to-pdf': (_input, options) => azw3ToPdf(options),
  'pdf-to-azw3': (_input, options) => pdfToAzw3(options),
  'docx-to-pdf': (_input, options) => docxToPdf(options),
  'pdf-to-docx': (_input, options) => pdfToDocx(options),
  'txt-to-pdf': (input, options) => txtToPdf(input as string, options),
  'pdf-to-txt': (_input, options) => pdfToTxt(options),
}
