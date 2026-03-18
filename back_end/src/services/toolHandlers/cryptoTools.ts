import crypto from 'crypto'
import type { ToolHandler } from '../../shared/types.js'

function hashText(algorithm: string, input: string): string {
  return crypto.createHash(algorithm).update(input, 'utf8').digest('hex')
}

function encryptAes(input: string, secret: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.createHash('sha256').update(secret).digest()
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(input, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('base64')
}

function decryptAes(input: string, secret: string): string {
  const parts = input.split(':')
  const ivHex = parts[0]
  const payload = parts[1]
  if (!ivHex || !payload) throw new Error('AES payload must use "iv:cipherText" format.')
  const iv = Buffer.from(ivHex, 'hex')
  const key = crypto.createHash('sha256').update(secret).digest()
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

function generatePassword(options: Record<string, unknown> = {}): string {
  const length = Number(options.length ?? 16)
  const includeSymbols = options.includeSymbols !== false
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' +
    (includeSymbols ? '!@#$%^&*()_+-=[]{}' : '')
  return Array.from(crypto.randomBytes(length))
    .map((byte) => alphabet[byte % alphabet.length])
    .join('')
}

function checkPasswordStrength(input: string): Record<string, unknown> {
  let score = 0
  if (input.length >= 8) score += 1
  if (input.length >= 12) score += 1
  if (/[a-z]/.test(input) && /[A-Z]/.test(input)) score += 1
  if (/\d/.test(input)) score += 1
  if (/[^A-Za-z0-9]/.test(input)) score += 1
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  const suggestions: (string | null)[] = [
    input.length < 12 ? 'Use at least 12 characters.' : null,
    !/\d/.test(input) ? 'Add numbers.' : null,
    !/[a-z]/.test(input) || !/[A-Z]/.test(input) ? 'Mix upper and lower case letters.' : null,
    !/[^A-Za-z0-9]/.test(input) ? 'Add symbols for stronger entropy.' : null,
  ]
  return { score, label: labels[score] ?? 'Very Weak', suggestions: suggestions.filter(Boolean) }
}

export const cryptoToolHandlers: Record<string, ToolHandler> = {
  'md5-generator': (input) => ({ output: hashText('md5', input as string) }),
  'sha1-generator': (input) => ({ output: hashText('sha1', input as string) }),
  'sha256-generator': (input) => ({ output: hashText('sha256', input as string) }),
  'sha512-generator': (input) => ({ output: hashText('sha512', input as string) }),
  'hmac-generator': (input, options) => ({
    output: crypto
      .createHmac((options?.algorithm as string) || 'sha256', (options?.secret as string) || '')
      .update(input as string)
      .digest('hex'),
  }),
  'aes-encrypt': (input, options) => ({
    output: encryptAes(input as string, (options?.secret as string) || ''),
  }),
  'aes-decrypt': (input, options) => ({
    output: decryptAes(input as string, (options?.secret as string) || ''),
  }),
  'rsa-encrypt': (input, options) => ({
    output: crypto
      .publicEncrypt(options?.publicKey as string, Buffer.from(input as string, 'utf8'))
      .toString('base64'),
  }),
  'rsa-decrypt': (input, options) => ({
    output: crypto
      .privateDecrypt(options?.privateKey as string, Buffer.from(input as string, 'base64'))
      .toString('utf8'),
  }),
  'password-generator': (_input, options) => ({ output: generatePassword(options) }),
  'password-strength-checker': (input) => ({ output: checkPasswordStrength(input as string) }),
}
