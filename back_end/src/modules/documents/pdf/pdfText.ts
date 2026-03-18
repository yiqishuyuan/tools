import PDFParser from 'pdf2json'

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser()

    const safeDecodePdfText = (value = ''): string => {
      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }

    parser.on('pdfParser_dataError', (errMsg: Error | { parserError: Error }) => {
      const msg = errMsg instanceof Error ? errMsg.message : errMsg?.parserError?.message || 'Failed to parse PDF text.'
      reject(new Error(msg))
    })

    parser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
      const text = (pdfData?.Pages || [])
        .flatMap((page) => page.Texts || [])
        .flatMap((item) => item.R || [])
        .map((run) => safeDecodePdfText(run.T || ''))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim()

      resolve(text)
    })

    parser.parseBuffer(buffer)
  })
}
