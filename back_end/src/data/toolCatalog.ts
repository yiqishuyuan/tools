const jsonTools: [string, string, string, boolean?][] = [
  ['json-formatter', 'JSON Formatter', 'Format JSON for readability.'],
  ['json-validator', 'JSON Validator', 'Validate JSON syntax and structure.'],
  ['json-minify', 'JSON Minify', 'Remove whitespace from JSON.'],
  ['json-pretty-print', 'JSON Pretty Print', 'Pretty print JSON output.'],
  ['json-viewer', 'JSON Viewer', 'Inspect JSON as formatted text.'],
  ['json-to-xml', 'JSON to XML', 'Convert JSON into XML.'],
  ['xml-to-json', 'XML to JSON', 'Convert XML into JSON.'],
  ['json-to-csv', 'JSON to CSV', 'Convert JSON arrays into CSV.'],
  ['csv-to-json', 'CSV to JSON', 'Convert CSV into JSON objects.'],
  ['json-to-yaml', 'JSON to YAML', 'Convert JSON into YAML.'],
  ['yaml-to-json', 'YAML to JSON', 'Convert YAML into JSON.'],
  ['json-compare', 'JSON Compare', 'Compare two JSON payloads.'],
  ['json-diff-tool', 'JSON Diff Tool', 'Find differences between two JSON payloads.'],
  ['json-path-tester', 'JSON Path Tester', 'Read values by JSON path.'],
  ['json-escape-unescape', 'JSON Escape / Unescape', 'Escape or unescape JSON strings.'],
]

const encodeTools: [string, string, string, boolean?][] = [
  ['base64', 'Base64 Encode/Decode', 'Encode text to Base64 or decode Base64 to text.'],
  ['url', 'URL Encode/Decode', 'Encode or decode URL-safe text.'],
  ['html-entity', 'HTML Encode/Decode', 'Encode or decode HTML entities.'],
  ['unicode-encode', 'Unicode Encode', 'Convert text to Unicode escapes.'],
  ['unicode-decode', 'Unicode Decode', 'Decode Unicode escapes.'],
  ['ascii-converter', 'ASCII Converter', 'Convert text into ASCII codes.'],
  ['string-escape-tool', 'String Escape Tool', 'Escape control characters in strings.'],
  ['binary-converter', 'Binary Converter', 'Convert text to binary.'],
  ['hex-converter', 'Hex Converter', 'Convert text to hexadecimal.'],
  ['utf-8-converter', 'UTF-8 Converter', 'Convert text to UTF-8 byte values.'],
  ['text-to-ascii', 'Text to ASCII', 'Convert text to ASCII codes.'],
  ['ascii-to-text', 'ASCII to Text', 'Convert ASCII codes to text.'],
]

const cryptoTools: [string, string, string, boolean?][] = [
  ['md5-generator', 'MD5 Generator', 'Generate an MD5 hash.'],
  ['sha1-generator', 'SHA1 Generator', 'Generate a SHA1 hash.'],
  ['sha256-generator', 'SHA256 Generator', 'Generate a SHA256 hash.'],
  ['sha512-generator', 'SHA512 Generator', 'Generate a SHA512 hash.'],
  ['file-hash-generator', 'File Hash Generator', 'Generate hash for uploaded files.', false],
  ['hmac-generator', 'HMAC Generator', 'Generate an HMAC signature.'],
  ['aes-encrypt', 'AES Encrypt', 'Encrypt text with AES.'],
  ['aes-decrypt', 'AES Decrypt', 'Decrypt AES text.'],
  ['rsa-encrypt', 'RSA Encrypt', 'Encrypt text with RSA public key.'],
  ['rsa-decrypt', 'RSA Decrypt', 'Decrypt text with RSA private key.'],
  ['password-generator', 'Password Generator', 'Generate random passwords.'],
  ['password-strength-checker', 'Password Strength Checker', 'Estimate password strength.'],
]

const devTools: [string, string, string, boolean?][] = [
  ['regex-tester', 'Regex Tester', 'Run regex matching against text.'],
  ['regex-generator', 'Regex Generator', 'Generate regex by rule templates.', false],
  ['http-request-tester', 'HTTP Request Tester', 'Send HTTP requests.', false],
  ['api-tester', 'API Tester', 'Debug HTTP APIs.', false],
  ['http-header-checker', 'HTTP Header Checker', 'Inspect HTTP headers.', false],
  ['user-agent-parser', 'User Agent Parser', 'Parse user agent strings.'],
  ['uuid-generator', 'UUID Generator', 'Generate UUID values.'],
  ['timestamp-converter', 'Timestamp Converter', 'Convert timestamps and dates.'],
  ['cron-expression-generator', 'Cron Expression Generator', 'Build cron expressions.', false],
  ['curl-to-fetch-converter', 'Curl to Fetch Converter', 'Convert curl to fetch code.'],
  ['curl-to-axios-converter', 'Curl to Axios Converter', 'Convert curl to axios code.'],
  ['sql-formatter', 'SQL Formatter', 'Format SQL statements.'],
  ['sql-minifier', 'SQL Minifier', 'Minify SQL statements.'],
  ['sql-to-json', 'SQL to JSON', 'Parse simple INSERT SQL to JSON.'],
  ['json-to-sql', 'JSON to SQL', 'Convert JSON rows to INSERT SQL.'],
]

const textTools: [string, string, string, boolean?][] = [
  ['word-counter', 'Word Counter', 'Count words in text.'],
  ['character-counter', 'Character Counter', 'Count characters in text.'],
  ['text-sorter', 'Text Sorter', 'Sort text lines.'],
  ['text-deduplicator', 'Text Deduplicator', 'Remove duplicated text lines.'],
  ['text-diff-checker', 'Text Diff Checker', 'Compare two texts.'],
  ['case-converter', 'Case Converter', 'Convert text casing.'],
  ['remove-line-breaks', 'Remove Line Breaks', 'Join text into a single line.'],
  ['remove-duplicate-lines', 'Remove Duplicate Lines', 'Remove duplicated lines.'],
  ['random-text-generator', 'Random Text Generator', 'Generate random strings.'],
  ['lorem-ipsum-generator', 'Lorem Ipsum Generator', 'Generate lorem ipsum text.'],
]

const imageTools: [string, string, string, boolean?][] = [
  ['image-compressor', 'Image Compressor', 'Compress images.', false],
  ['image-resizer', 'Image Resizer', 'Resize images.', false],
  ['image-cropper', 'Image Cropper', 'Crop images.', false],
  ['image-to-base64', 'Image to Base64', 'Convert image file to Base64.', false],
  ['base64-to-image', 'Base64 to Image', 'Convert Base64 to image file.', false],
  ['image-format-converter', 'Image Format Converter', 'Convert image format.', false],
  ['qr-code-generator', 'QR Code Generator', 'Generate QR codes.', false],
  ['qr-code-scanner', 'QR Code Scanner', 'Scan QR codes from images.', false],
  ['image-metadata-viewer', 'Image Metadata Viewer', 'Read image metadata.', false],
  ['screenshot-to-pdf', 'Screenshot to PDF', 'Convert screenshots to PDF.', false],
]

const docTools: [string, string, string, boolean?][] = [
  ['epub-to-pdf', 'EPUB to PDF', 'Convert EPUB files into PDF.'],
  ['pdf-to-epub', 'PDF to EPUB', 'Convert PDF files into EPUB.'],
  ['azw3-to-pdf', 'AZW3 to PDF', 'Convert AZW3 files into PDF.'],
  ['pdf-to-azw3', 'PDF to AZW3', 'Convert PDF files into AZW3.'],
  ['docx-to-pdf', 'DOCX to PDF', 'Convert DOCX files into PDF.'],
  ['pdf-to-docx', 'PDF to DOCX', 'Convert PDF files into DOCX.'],
  ['txt-to-pdf', 'TXT to PDF', 'Convert TXT content into PDF.'],
  ['pdf-to-txt', 'PDF to TXT', 'Convert PDF files into plain text.'],
]

const fileTools: [string, string, string, boolean?][] = [
  ['file-hash-checker', 'File Hash Checker', 'Check uploaded file hash.', false],
  ['file-size-converter', 'File Size Converter', 'Convert file size units.'],
  ['zip-compressor', 'ZIP Compressor', 'Compress files into ZIP.', false],
  ['zip-extractor', 'ZIP Extractor', 'Extract ZIP archives.', false],
  ['pdf-merger', 'PDF Merger', 'Merge PDF files.', false],
  ['pdf-splitter', 'PDF Splitter', 'Split PDF files.', false],
  ['file-to-base64', 'File to Base64', 'Convert file to Base64.', false],
  ['base64-to-file', 'Base64 to File', 'Convert Base64 to file.', false],
]

const dateTools: [string, string, string, boolean?][] = [
  ['timestamp-to-date', 'Timestamp to Date', 'Convert timestamps to date strings.'],
  ['date-to-timestamp', 'Date to Timestamp', 'Convert date strings to timestamps.'],
  ['time-zone-converter', 'Time Zone Converter', 'Convert time zones.'],
  ['unix-time-converter', 'Unix Time Converter', 'Convert Unix seconds and milliseconds.'],
  ['age-calculator', 'Age Calculator', 'Calculate age from birth date.'],
  ['countdown-timer-generator', 'Countdown Timer Generator', 'Generate countdown metadata.'],
  ['working-days-calculator', 'Working Days Calculator', 'Count working days in a range.'],
  ['random-date-generator', 'Random Date Generator', 'Generate a random date in range.'],
]

const networkTools: [string, string, string, boolean?][] = [
  ['ip-lookup', 'IP Lookup', 'Look up IP information.', false],
  ['dns-lookup', 'DNS Lookup', 'Resolve DNS records.', false],
  ['whois-lookup', 'Whois Lookup', 'Run a whois query.'],
  ['port-checker', 'Port Checker', 'Check whether a port is open.', false],
  ['http-status-checker', 'HTTP Status Checker', 'Check website HTTP status.'],
  ['url-parser', 'URL Parser', 'Parse URL structure.'],
  ['url-shortener', 'URL Shortener', 'Create short links.', false],
]

export interface ToolCatalogItem {
  id: string
  name: string
  description: string
  categoryKey: string
  implemented: boolean
}

export interface ToolCatalogCategory {
  key: string
  title: string
  description: string
  tools: ToolCatalogItem[]
}

function buildTools(
  categoryKey: string,
  items: [string, string, string, boolean?][],
): ToolCatalogItem[] {
  return items.map(([id, name, description, implemented = true]) => ({
    id,
    name,
    description,
    categoryKey,
    implemented,
  }))
}

export const toolCatalog: ToolCatalogCategory[] = [
  {
    key: 'json',
    title: 'JSON / 数据格式工具',
    description: 'JSON、XML、CSV、YAML 等格式转换与验证。',
    tools: buildTools('json', jsonTools),
  },
  {
    key: 'encode',
    title: '编码 / 解码工具',
    description: '常见文本、编码和字符集转换。',
    tools: buildTools('encode', encodeTools),
  },
  {
    key: 'crypto',
    title: '加密 / 哈希工具',
    description: '散列、HMAC、密码与加解密。',
    tools: buildTools('crypto', cryptoTools),
  },
  {
    key: 'dev',
    title: '开发工具',
    description: '正则、SQL、时间戳、UUID 等开发辅助能力。',
    tools: buildTools('dev', devTools),
  },
  {
    key: 'text',
    title: '文本处理工具',
    description: '文本统计、排序、去重、Diff 与生成。',
    tools: buildTools('text', textTools),
  },
  {
    key: 'image',
    title: '图片工具',
    description: '图片处理与二维码相关能力。',
    tools: buildTools('image', imageTools),
  },
  {
    key: 'doc',
    title: '文档转换工具',
    description: 'EPUB、AZW3、DOCX、TXT 与 PDF 转换。',
    tools: buildTools('doc', docTools),
  },
  {
    key: 'file',
    title: '文件工具',
    description: '文件转换、压缩与 PDF 处理。',
    tools: buildTools('file', fileTools),
  },
  {
    key: 'date',
    title: '日期时间工具',
    description: '日期、时间戳、时区与工作日计算。',
    tools: buildTools('date', dateTools),
  },
  {
    key: 'network',
    title: '网络工具',
    description: 'URL、HTTP、Whois 等网络相关工具。',
    tools: buildTools('network', networkTools),
  },
]

export const flatToolCatalog = toolCatalog.flatMap((category) => category.tools)
