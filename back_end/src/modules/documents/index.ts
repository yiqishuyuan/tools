import { Document, Packer, Paragraph, TextRun } from 'docx'
import { convertWithCalibre, convertWithCalibreFromBuffer } from './calibre/calibreConvert.js'
import { extractTextFromPdfBuffer } from './pdf/pdfText.js'
import {
  createFileResult,
  normalizeFilePayload,
  toSafeFileStem,
} from '../shared/filePayload.js'

export interface DocOptions {
  title?: string
  file?: Record<string, unknown>
}

export async function txtToPdf(text: string, options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  const title = (options.title as string) || 'TXT to PDF'
  const inputFilename = `${toSafeFileStem(title)}.txt`
  const buffer = Buffer.from(text, 'utf-8')
  return convertWithCalibreFromBuffer(buffer, inputFilename, '.pdf')
}

export async function pdfToTxt(options: DocOptions = {}): Promise<{ output: string }> {
  const { name, buffer } = normalizeFilePayload(options.file, ['.pdf'])
  const text = await extractTextFromPdfBuffer(buffer)
  return {
    output: text || `No extractable text found in ${name}.`,
  }
}

export async function docxToPdf(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  return convertWithCalibre({
    file: options.file,
    inputExtensions: ['.docx'],
    outputExtension: '.pdf',
  })
}

export async function pdfToDocx(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  const { name, buffer } = normalizeFilePayload(options.file, ['.pdf'])
  const text = await extractTextFromPdfBuffer(buffer)
  const paragraphs = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => new Paragraph({ children: [new TextRun(line)] }))

  const doc = new Document({
    sections: [
      {
        children:
          paragraphs.length > 0
            ? paragraphs
            : [new Paragraph({ children: [new TextRun(`No extractable text found in ${name}.`)] })],
      },
    ],
  })

  const docxBuffer = await Packer.toBuffer(doc)
  return createFileResult(
    name.replace(/\.pdf$/i, '.docx'),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    docxBuffer,
    'PDF -> DOCX converted successfully. The current implementation exports extracted text content.',
  )
}

export async function epubToPdf(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  return convertWithCalibre({
    file: options.file,
    inputExtensions: ['.epub'],
    outputExtension: '.pdf',
  })
}

export async function azw3ToPdf(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  return convertWithCalibre({
    file: options.file,
    inputExtensions: ['.azw3'],
    outputExtension: '.pdf',
  })
}

export async function pdfToAzw3(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  return convertWithCalibre({
    file: options.file,
    inputExtensions: ['.pdf'],
    outputExtension: '.azw3',
  })
}

export async function pdfToEpub(options: DocOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  return convertWithCalibre({
    file: options.file,
    inputExtensions: ['.pdf'],
    outputExtension: '.epub',
  })
}
