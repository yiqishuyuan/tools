import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import {
  createFileResult,
  getMimeTypeByExtension,
  normalizeFilePayload,
} from '../../shared/filePayload.js'

/** 转换超时时间（毫秒），大文件可适当调大 */
const CONVERT_TIMEOUT_MS = 30 * 60 * 1000

function runEbookConvert(
  command: string,
  args: string[],
  timeoutMs: number = CONVERT_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
      timeout: timeoutMs,
    }, (err, _stdout, stderr) => {
      if (err) {
        const isTimeout = err.killed === true || (err as NodeJS.ErrnoException).code === 'ETIMEDOUT'
        const msg = isTimeout
          ? `转换超时（${CONVERT_TIMEOUT_MS / 60000} 分钟），请尝试较小文件或稍后重试。`
          : (err.message || (stderr && String(stderr).trim()) || 'ebook-convert 执行失败')
        reject(new Error(msg))
      } else {
        resolve()
      }
    })
    child.on('error', reject)
  })
}

export function resolveEbookConvertCommand(): string | null {
  const candidates = [
    process.env.CALIBRE_EBOOK_CONVERT,
    'C:\\Program Files\\Calibre2\\ebook-convert.exe',
    'C:\\Program Files (x86)\\Calibre2\\ebook-convert.exe',
    path.join(process.cwd(), 'ebook-convert.exe'),
    path.join(process.cwd(), 'Calibre', 'ebook-convert.exe'),
    'ebook-convert',
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    if (candidate === 'ebook-convert' || existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

export interface CalibreConvertOptions {
  file?: Record<string, unknown>
  inputExtensions?: string[]
  outputExtension?: string
  outputName?: string
}

export async function convertWithCalibre(options: CalibreConvertOptions = {}): Promise<ReturnType<typeof createFileResult>> {
  const { file, inputExtensions = [], outputExtension = '', outputName } = options
  const { name, buffer } = normalizeFilePayload(file, inputExtensions)
  const command = resolveEbookConvertCommand()

  if (!command) {
    throw new Error(
      '文档转换需要 Calibre。请安装 Calibre 或将 ebook-convert 路径配置到环境变量 CALIBRE_EBOOK_CONVERT。',
    )
  }

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tool-doc-'))
  const inputPath = path.join(tmpDir, name)
  const finalOutputName = outputName || name.replace(/\.[^.]+$/i, outputExtension)
  const outputPath = path.join(tmpDir, finalOutputName)

  try {
    await writeFile(inputPath, buffer)
    const args: string[] = [inputPath, outputPath]
    if (outputExtension.toLowerCase() === '.pdf') {
      args.push('--embed-all-fonts')
    }
    await runEbookConvert(command, args)
    const outputBuffer = await readFile(outputPath)
    const result = createFileResult(
      finalOutputName,
      getMimeTypeByExtension(outputExtension),
      outputBuffer,
      `${path.extname(name).replace('.', '').toUpperCase()} -> ${outputExtension.replace('.', '').toUpperCase()} converted successfully via Calibre.`,
    )
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    return result
  } catch (err) {
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}

/**
 * 使用本地 ebook-convert 从内存 buffer 转换（如 TXT 文本先写入临时文件再转换）
 */
export async function convertWithCalibreFromBuffer(
  buffer: Buffer,
  inputFilename: string,
  outputExtension: string,
): Promise<ReturnType<typeof createFileResult>> {
  const command = resolveEbookConvertCommand()
  if (!command) {
    throw new Error(
      '文档转换需要 Calibre。请安装 Calibre 或将 ebook-convert 路径配置到环境变量 CALIBRE_EBOOK_CONVERT。',
    )
  }
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tool-doc-'))
  const inputPath = path.join(tmpDir, inputFilename)
  const finalOutputName = inputFilename.replace(/\.[^.]+$/i, outputExtension)
  const outputPath = path.join(tmpDir, finalOutputName)

  try {
    await writeFile(inputPath, buffer)
    const args: string[] = [inputPath, outputPath]
    if (outputExtension.toLowerCase() === '.pdf') {
      args.push('--embed-all-fonts')
    }
    await runEbookConvert(command, args)
    const outputBuffer = await readFile(outputPath)
    const result = createFileResult(
      finalOutputName,
      getMimeTypeByExtension(outputExtension),
      outputBuffer,
      `${path.extname(inputFilename).replace('.', '').toUpperCase()} -> ${outputExtension.replace('.', '').toUpperCase()} 已通过本地 Calibre 转换完成。`,
    )
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    return result
  } catch (err) {
    rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}
