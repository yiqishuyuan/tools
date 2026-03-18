import {
  createFileResult,
  normalizeFilePayload,
  toSafeFileStem,
} from '../../modules/shared/filePayload.js'
import type { ToolHandler } from '../../shared/types.js'
import { PDFDocument } from 'pdf-lib'

function detectImageMimeType(buffer: Buffer): string {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png'
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (buffer.length >= 6) {
    const signature = buffer.subarray(0, 6).toString('ascii')
    if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif'
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (buffer.length >= 2 && buffer.subarray(0, 2).toString('ascii') === 'BM') {
    return 'image/bmp'
  }
  const textSample = buffer.subarray(0, 256).toString('utf8').trimStart().toLowerCase()
  if (textSample.startsWith('<svg') || textSample.startsWith('<?xml')) {
    return 'image/svg+xml'
  }
  return 'application/octet-stream'
}

function getPngDimensions(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function getGifDimensions(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
}

function getBmpDimensions(buffer: Buffer): { width: number; height: number } {
  return {
    width: buffer.readInt32LE(18),
    height: Math.abs(buffer.readInt32LE(22)),
  }
}

function getWebpDimensions(buffer: Buffer): { width?: number; height?: number } {
  const chunkType = buffer.subarray(12, 16).toString('ascii')
  if (chunkType === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    }
  }
  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26), height: buffer.readUInt16LE(28) }
  }
  if (chunkType === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    }
  }
  return {}
}

function getJpegDimensions(buffer: Buffer): { width?: number; height?: number } {
  let offset = 2
  const markers = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) offset += 1
    const marker = buffer[offset]
    offset += 1
    if (!marker || marker === 0xd9 || marker === 0xda) break
    const size = buffer.readUInt16BE(offset)
    if (markers.includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      }
    }
    offset += size
  }
  return {}
}

function getImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width?: number; height?: number } {
  try {
    switch (mimeType) {
      case 'image/png':
        return getPngDimensions(buffer)
      case 'image/jpeg':
        return getJpegDimensions(buffer)
      case 'image/gif':
        return getGifDimensions(buffer)
      case 'image/webp':
        return getWebpDimensions(buffer)
      case 'image/bmp':
        return getBmpDimensions(buffer)
      default:
        return {}
    }
  } catch {
    return {}
  }
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return '.png'
    case 'image/jpeg':
      return '.jpg'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    case 'image/bmp':
      return '.bmp'
    case 'image/svg+xml':
      return '.svg'
    default:
      return ''
  }
}

function parseBase64ImageInput(input: unknown): {
  mimeType: string
  base64: string
  buffer: Buffer
} {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('Image Base64 content is required.')
  const dataUrlMatch = raw.match(/^data:([^;,]+)?;base64,([\s\S]+)$/i)
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1] || 'application/octet-stream'
    const base64 = dataUrlMatch[2].replace(/\s+/g, '')
    return { mimeType, base64, buffer: Buffer.from(base64, 'base64') }
  }
  const base64 = raw.replace(/\s+/g, '')
  const buffer = Buffer.from(base64, 'base64')
  return { mimeType: detectImageMimeType(buffer), base64, buffer }
}

export const imageToolHandlers: Record<string, ToolHandler> = {
  'image-to-base64': (_input, options = {}) => {
    const file = options.file as Record<string, unknown>
    const { name, buffer } = normalizeFilePayload(file)
    const mimeType = String(file?.type || detectImageMimeType(buffer))
    const base64 = buffer.toString('base64')
    return {
      output: {
        filename: name,
        mimeType,
        sizeBytes: buffer.length,
        base64,
        dataUrl: `data:${mimeType};base64,${base64}`,
      },
      previewImage: `data:${mimeType};base64,${base64}`,
    }
  },
  'base64-to-image': (input, options = {}) => {
    const { mimeType, base64, buffer } = parseBase64ImageInput(input)
    if (!mimeType.startsWith('image/')) {
      throw new Error('The provided Base64 content is not a supported image.')
    }
    const filename =
      String(options.filename || '').trim() ||
      `${toSafeFileStem((options.name as string) || 'converted_image')}${extensionFromMimeType(mimeType)}`
    return {
      ...createFileResult(filename, mimeType, buffer, `已从 Base64 还原图片：${filename}`),
      previewImage: `data:${mimeType};base64,${base64}`,
    }
  },
  'image-metadata-viewer': (_input, options = {}) => {
    const file = options.file as Record<string, unknown>
    const { name, buffer, extension } = normalizeFilePayload(file)
    const mimeType = String(file?.type || detectImageMimeType(buffer))
    return {
      output: {
        filename: name,
        extension,
        mimeType,
        sizeBytes: buffer.length,
        ...getImageDimensions(buffer, mimeType),
      },
    }
  },
  'screenshot-to-pdf': async (_input, options = {}) => {
    const file = options.file as Record<string, unknown>
    const { name, buffer } = normalizeFilePayload(file)
    const mimeType = String(file?.type || detectImageMimeType(buffer))
    const doc = await PDFDocument.create()
    let image
    if (mimeType === 'image/png') {
      image = await doc.embedPng(buffer)
    } else if (mimeType === 'image/jpeg') {
      image = await doc.embedJpg(buffer)
    } else {
      throw new Error('截图转 PDF 仅支持 PNG/JPEG 图片。')
    }
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    })
    const bytes = Buffer.from(await doc.save())
    const filename = `${toSafeFileStem(name.replace(/\.[^.]+$/, ''))}.pdf`
    return createFileResult(
      filename,
      'application/pdf',
      bytes,
      `已转换为 PDF：${filename}`,
    )
  },
}
