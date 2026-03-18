import crypto from 'crypto'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import {
  createFileResult,
  normalizeFilePayload,
  toSafeFileStem,
} from '../../modules/shared/filePayload.js'
import type { ToolHandler } from '../../shared/types.js'

const HASH_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512']

function normalizeHashAlgorithm(value: unknown): string {
  const algorithm = String(value || 'sha256').toLowerCase().replace(/-/g, '')
  if (!HASH_ALGORITHMS.includes(algorithm)) throw new Error('Unsupported hash algorithm: ' + String(value))
  return algorithm
}

function parseBase64Input(input: unknown, fallbackMimeType = 'application/octet-stream'): { mimeType: string; base64: string } {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('Base64 content is required.')
  const dataUrlMatch = raw.match(/^data:([^;,]+)?;base64,([\s\S]+)$/i)
  if (dataUrlMatch) {
    return { mimeType: dataUrlMatch[1] || fallbackMimeType, base64: dataUrlMatch[2].replace(/\s+/g, '') }
  }
  return { mimeType: fallbackMimeType, base64: raw.replace(/\s+/g, '') }
}

function extensionFromMimeType(mimeType: string): string {
  const m = String(mimeType).toLowerCase()
  if (m === 'text/plain') return '.txt'
  if (m === 'application/json') return '.json'
  if (m === 'application/pdf') return '.pdf'
  if (m === 'image/png') return '.png'
  if (m === 'image/jpeg') return '.jpg'
  if (m === 'image/gif') return '.gif'
  if (m === 'image/webp') return '.webp'
  return ''
}

function bufferFromOptionFile(options: Record<string, unknown>) {
  return normalizeFilePayload(options.file as Record<string, unknown>)
}

export const fileToolHandlers: Record<string, ToolHandler> = {
  'file-hash-generator': (_input, options = {}) => {
    const algorithm = normalizeHashAlgorithm(options.algorithm)
    const { name, buffer } = bufferFromOptionFile(options)
    const hash = crypto.createHash(algorithm).update(buffer).digest('hex')
    return { output: { filename: name, algorithm: algorithm.toUpperCase(), sizeBytes: buffer.length, hash } }
  },
  'file-hash-checker': (_input, options = {}) => {
    const algorithm = normalizeHashAlgorithm(options.algorithm)
    const expectedHash = String(options.expectedHash || '').trim().toLowerCase()
    if (!expectedHash) throw new Error('Expected hash is required.')
    const { name, buffer } = bufferFromOptionFile(options)
    const actualHash = crypto.createHash(algorithm).update(buffer).digest('hex')
    return { output: { filename: name, algorithm: algorithm.toUpperCase(), expectedHash, actualHash, matched: actualHash.toLowerCase() === expectedHash } }
  },
  'file-to-base64': (_input, options = {}) => {
    const { name, buffer } = bufferFromOptionFile(options)
    const mimeType = String((options.file as Record<string, unknown>)?.type || 'application/octet-stream')
    const base64 = buffer.toString('base64')
    return { output: { filename: name, mimeType, sizeBytes: buffer.length, base64, dataUrl: 'data:' + mimeType + ';base64,' + base64 } }
  },
  'base64-to-file': (input, options = {}) => {
    const { mimeType, base64 } = parseBase64Input(input, options.mimeType as string)
    const buffer = Buffer.from(base64, 'base64')
    const providedName = String(options.filename || '').trim()
    const ext = extensionFromMimeType(mimeType)
    const filename = providedName || toSafeFileStem((options.name as string) || 'converted_file') + ext
    return createFileResult(filename, mimeType, buffer, 'Base64 to file: ' + filename + ' (' + buffer.length + ' bytes)')
  },
  'zip-compressor': (_input, options = {}) => {
    const { name, buffer } = bufferFromOptionFile(options)
    const zip = new JSZip()
    zip.file(name, buffer)
    return zip.generateAsync({ type: 'nodebuffer' }).then((zipBuffer) =>
      createFileResult(
        toSafeFileStem(name) + '.zip',
        'application/zip',
        zipBuffer as Buffer,
        '已压缩为 ZIP：' + name,
      ),
    )
  },
  'zip-extractor': async (_input, options = {}) => {
    const { name, buffer } = normalizeFilePayload(options.file as Record<string, unknown>, ['.zip'])
    const zip = await JSZip.loadAsync(buffer)
    const outZip = new JSZip()
    const names: string[] = []
    const entries = Object.entries(zip.files).filter(([, f]) => !f.dir)
    for (const [pathName, entry] of entries) {
      names.push(pathName)
      const data = await entry.async('nodebuffer')
      outZip.file(pathName, data)
    }
    const outBuffer = await outZip.generateAsync({ type: 'nodebuffer' })
    const outName = toSafeFileStem(name.replace(/\.zip$/i, '')) + '_extracted.zip'
    return createFileResult(
      outName,
      'application/zip',
      outBuffer as Buffer,
      '已解压 ' + entries.length + ' 个文件，打包为 ' + outName + '。列表：' + names.join(', '),
    )
  },
  'pdf-merger': async (_input, options = {}) => {
    const files = options.files as Array<{ name?: string; contentBase64?: string }> | undefined
    if (!Array.isArray(files) || files.length === 0) throw new Error('请至少上传一个 PDF 文件。')
    const mergedPdf = await PDFDocument.create()
    let mergedCount = 0
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!f || typeof f !== 'object' || !(f.contentBase64 && typeof f.contentBase64 === 'string')) continue
      const buf = Buffer.from(f.contentBase64, 'base64')
      const src = await PDFDocument.load(buf)
      const indices = src.getPageIndices()
      const copied = await mergedPdf.copyPages(src, indices)
      copied.forEach((p) => mergedPdf.addPage(p))
      mergedCount += 1
    }
    if (mergedCount === 0) throw new Error('没有有效的 PDF 文件可合并，请上传至少一个含内容的 PDF。')
    const outBuf = Buffer.from(await mergedPdf.save())
    const outName = 'merged.pdf'
    return createFileResult(outName, 'application/pdf', outBuf, '已合并 ' + mergedCount + ' 个 PDF。')
  },
  'pdf-splitter': async (_input, options = {}) => {
    const { name, buffer } = normalizeFilePayload(options.file as Record<string, unknown>, ['.pdf'])
    const src = await PDFDocument.load(buffer)
    const pageCount = src.getPageCount()
    const zip = new JSZip()
    const baseName = toSafeFileStem(name.replace(/\.pdf$/i, ''))
    for (let i = 0; i < pageCount; i++) {
      const doc = await PDFDocument.create()
      const [page] = await doc.copyPages(src, [i])
      doc.addPage(page)
      const bytes = Buffer.from(await doc.save())
      zip.file(`${baseName}_page${i + 1}.pdf`, bytes)
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipName = baseName + '_split.zip'
    return createFileResult(
      zipName,
      'application/zip',
      zipBuffer as Buffer,
      '已按页拆分为 ' + pageCount + ' 个 PDF，打包为 ' + zipName,
    )
  },
}
