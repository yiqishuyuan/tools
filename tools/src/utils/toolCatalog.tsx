import type { ReactNode } from 'react'
import {
  CodeOutlined,
  FileOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  PictureOutlined,
  DeploymentUnitOutlined,
  CalendarOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  SwapOutlined,
  ThunderboltOutlined,
  EditOutlined,
  RiseOutlined,
  ProfileOutlined,
  BranchesOutlined,
} from '@ant-design/icons'

export type ToolFieldOption = {
  label: string
  value: string | number
}

export type ToolField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'password' | 'number' | 'select' | 'checkbox' | 'date' | 'file'
  placeholder?: string
  defaultValue?: unknown
  options?: ToolFieldOption[]
  accept?: string
  multiple?: boolean
}

export type ToolMode = 'single' | 'compare' | 'generator' | 'placeholder'

export type ToolDefinition = {
  id: string
  name: string
  description: string
  categoryKey: string
  path: string
  keywords: string[]
  actionLabel: string
  mode: ToolMode
  placeholder?: string
  secondaryPlaceholder?: string
  inputLabel?: string
  secondaryInputLabel?: string
  fields?: ToolField[]
  outputType?: 'text' | 'image'
  frontend: boolean
}

export type ToolCategory = {
  key: string
  title: string
  description: string
  icon: ReactNode
  color: string
  tools: ToolDefinition[]
}

const BASE = '/tools'
const CATEGORY_COLORS: Record<string, string> = {
  json: '#1890ff',
  encode: '#13c2c2',
  crypto: '#eb2f96',
  dev: '#722ed1',
  text: '#52c41a',
  image: '#faad14',
  doc: '#eb2f96',
  file: '#fa8c16',
  date: '#389e0d',
  network: '#2f54eb',
  color: '#eb2f96',
  convert: '#389e0d',
  random: '#722ed1',
  web: '#13c2c2',
  seo: '#fa8c16',
  log: '#faad14',
  git: '#2f54eb',
}

function createTool(
  categoryKey: string,
  id: string,
  name: string,
  description: string,
  opts: Partial<ToolDefinition> & { frontend?: boolean } = {},
): ToolDefinition {
  return {
    id,
    name,
    description,
    categoryKey,
    path: `${BASE}/${id}`,
    keywords: [name, description, categoryKey],
    actionLabel: '执行',
    mode: 'single',
    frontend: opts.frontend ?? true,
    inputLabel: '输入',
    placeholder: '请输入内容',
    ...opts,
  }
}

const modeEncodeDecode = [
  { key: 'mode', label: '模式', type: 'select' as const, defaultValue: 'encode', options: [{ value: 'encode', label: '编码' }, { value: 'decode', label: '解码' }] },
]

const lengthUnitOptions = [
  { value: 'mm', label: '毫米 (mm)' },
  { value: 'cm', label: '厘米 (cm)' },
  { value: 'm', label: '米 (m)' },
  { value: 'km', label: '千米 (km)' },
  { value: 'in', label: '英寸 (in)' },
  { value: 'ft', label: '英尺 (ft)' },
  { value: 'yd', label: '码 (yd)' },
  { value: 'mi', label: '英里 (mi)' },
]

const weightUnitOptions = [
  { value: 'g', label: '克 (g)' },
  { value: 'kg', label: '千克 (kg)' },
  { value: 't', label: '吨 (t)' },
  { value: 'lb', label: '磅 (lb)' },
  { value: 'oz', label: '盎司 (oz)' },
]

const temperatureUnitOptions = [
  { value: 'C', label: '摄氏度 (°C)' },
  { value: 'F', label: '华氏度 (°F)' },
  { value: 'K', label: '开尔文 (K)' },
]

const speedUnitOptions = [
  { value: 'm/s', label: '米/秒 (m/s)' },
  { value: 'km/h', label: '千米/小时 (km/h)' },
  { value: 'mph', label: '英里/小时 (mph)' },
  { value: 'knot', label: '节 (knot)' },
]

const dataSizeUnitOptions = [
  { value: 'B', label: '字节 (B)' },
  { value: 'KB', label: 'KB' },
  { value: 'MB', label: 'MB' },
  { value: 'GB', label: 'GB' },
  { value: 'TB', label: 'TB' },
]

const energyUnitOptions = [
  { value: 'J', label: '焦耳 (J)' },
  { value: 'kJ', label: '千焦 (kJ)' },
  { value: 'cal', label: '卡 (cal)' },
  { value: 'kcal', label: '千卡 (kcal)' },
  { value: 'Wh', label: '瓦时 (Wh)' },
  { value: 'kWh', label: '千瓦时 (kWh)' },
]

const angleUnitOptions = [
  { value: 'deg', label: '度 (deg)' },
  { value: 'rad', label: '弧度 (rad)' },
]

const randomCharsetOptions = [
  { value: 'alnum', label: '字母+数字' },
  { value: 'alpha', label: '仅字母' },
  { value: 'numeric', label: '仅数字' },
  { value: 'custom', label: '自定义' },
]

const jsonTools: ToolDefinition[] = [
  createTool('json', 'json-formatter', 'JSON 格式化', '格式化、美化 JSON 文本。'),
  createTool('json', 'json-validator', 'JSON 校验', '校验 JSON 语法是否正确。'),
  createTool('json', 'json-minify', 'JSON 压缩', '压缩 JSON 去除空白。'),
  createTool('json', 'json-pretty-print', 'JSON 美化', '将 JSON 格式化输出。'),
  createTool('json', 'json-viewer', 'JSON 查看', '以可读形式查看 JSON。'),
  createTool('json', 'json-xml-converter', 'JSON/XML 转换', 'JSON 与 XML 双向转换。', {
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'json-to-xml',
        options: [
          { value: 'json-to-xml', label: 'JSON → XML' },
          { value: 'xml-to-json', label: 'XML → JSON' },
        ],
      },
    ],
    placeholder: '输入 JSON 或 XML',
  }),
  createTool('json', 'json-csv-converter', 'JSON/CSV 转换', 'JSON 与 CSV 双向转换。', {
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'json-to-csv',
        options: [
          { value: 'json-to-csv', label: 'JSON → CSV' },
          { value: 'csv-to-json', label: 'CSV → JSON' },
        ],
      },
    ],
    placeholder: '输入 JSON 数组或 CSV',
  }),
  createTool('json', 'json-yaml-converter', 'JSON/YAML 转换', 'JSON 与 YAML 双向转换。', {
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'json-to-yaml',
        options: [
          { value: 'json-to-yaml', label: 'JSON → YAML' },
          { value: 'yaml-to-json', label: 'YAML → JSON' },
        ],
      },
    ],
    placeholder: '输入 JSON 或 YAML',
  }),
  createTool('json', 'json-compare', 'JSON 对比', '对比两份 JSON。', {
    mode: 'compare',
    inputLabel: 'JSON A',
    secondaryInputLabel: 'JSON B',
    placeholder: '第一份 JSON',
    secondaryPlaceholder: '第二份 JSON',
  }),
  createTool('json', 'json-diff-tool', 'JSON Diff', '比较两份 JSON 差异。', {
    mode: 'compare',
    inputLabel: 'JSON A',
    secondaryInputLabel: 'JSON B',
    placeholder: '第一份 JSON',
    secondaryPlaceholder: '第二份 JSON',
  }),
  createTool('json', 'json-path-tester', 'JSON Path', '按路径查询 JSON。', {
    placeholder: '粘贴 JSON 文本',
    fields: [{ key: 'path', label: 'JSONPath 表达式', type: 'text', defaultValue: '$', placeholder: '$' }],
  }),
  createTool('json', 'json-escape-unescape', 'JSON 转义/反转义', '对 JSON 字符串转义或反转义。', {
    fields: [{ key: 'mode', label: '模式', type: 'select', defaultValue: 'escape', options: [{ value: 'escape', label: '转义' }, { value: 'unescape', label: '反转义' }] }],
  }),
]

const encodeTools: ToolDefinition[] = [
  createTool('encode', 'base64', 'Base64 编码/解码', '文本与 Base64 互转。', { fields: modeEncodeDecode }),
  createTool('encode', 'url', 'URL 编码/解码', 'URL 编码或解码。', { fields: modeEncodeDecode }),
  createTool('encode', 'html-entity', 'HTML 编码/解码', 'HTML 实体编码或解码。', { fields: modeEncodeDecode }),
  createTool('encode', 'unicode-converter', 'Unicode 编码/解码', 'Unicode 转义与还原。', {
    fields: modeEncodeDecode,
  }),
  createTool('encode', 'ascii-converter', 'ASCII 编码/解码', '文本与 ASCII 码互转。', {
    fields: modeEncodeDecode,
  }),
  createTool('encode', 'string-escape-tool', '字符串转义', '转义特殊字符。'),
  createTool('encode', 'binary-converter', '二进制转换', '文本与二进制互转。'),
  createTool('encode', 'hex-converter', '十六进制转换', '文本与十六进制互转。'),
  createTool('encode', 'utf-8-converter', 'UTF-8 转换', '文本与 UTF-8 字节互转。'),
]

const cryptoTools: ToolDefinition[] = [
  createTool('crypto', 'md5-generator', 'MD5', '计算 MD5 哈希。', { frontend: false }),
  createTool('crypto', 'sha1-generator', 'SHA1', '计算 SHA1 哈希。', { placeholder: '输入要哈希的文本' }),
  createTool('crypto', 'sha256-generator', 'SHA256', '计算 SHA256 哈希。', { placeholder: '输入要哈希的文本' }),
  createTool('crypto', 'sha512-generator', 'SHA512', '计算 SHA512 哈希。', { placeholder: '输入要哈希的文本' }),
  createTool('crypto', 'file-hash-generator', '文件哈希', '计算上传文件的哈希。', {
    frontend: false,
    mode: 'generator',
    fields: [
      { key: 'file', label: '选择文件', type: 'file' },
      { key: 'algorithm', label: '算法', type: 'select', defaultValue: 'sha256', options: [{ value: 'md5', label: 'MD5' }, { value: 'sha1', label: 'SHA1' }, { value: 'sha256', label: 'SHA256' }, { value: 'sha512', label: 'SHA512' }] },
    ],
  }),
  createTool('crypto', 'hmac-generator', 'HMAC', '生成 HMAC 签名。', {
    placeholder: '待签名内容',
    fields: [
      { key: 'algorithm', label: '算法', type: 'select', defaultValue: 'SHA-256', options: [{ value: 'SHA-1', label: 'SHA-1' }, { value: 'SHA-256', label: 'SHA-256' }, { value: 'SHA-512', label: 'SHA-512' }] },
      { key: 'secret', label: '密钥', type: 'password', placeholder: 'HMAC 密钥' },
    ],
  }),
  createTool('crypto', 'aes-crypto-converter', 'AES 加密/解密', 'AES 文本加解密。', {
    fields: [
      {
        key: 'mode',
        label: '模式',
        type: 'select',
        defaultValue: 'encrypt',
        options: [
          { value: 'encrypt', label: '加密' },
          { value: 'decrypt', label: '解密' },
        ],
      },
      { key: 'secret', label: '密钥', type: 'password', placeholder: '请输入密钥' },
    ],
    placeholder: '输入待处理文本',
  }),
  createTool('crypto', 'rsa-encrypt', 'RSA 加密', '使用公钥加密。', { frontend: false }),
  createTool('crypto', 'rsa-decrypt', 'RSA 解密', '使用私钥解密。', { frontend: false }),
  createTool('crypto', 'password-generator', '密码生成', '生成随机密码。', {
    mode: 'generator',
    fields: [
      { key: 'length', label: '长度', type: 'number', defaultValue: '16' },
      { key: 'includeSymbols', label: '包含符号', type: 'checkbox', defaultValue: true },
    ],
  }),
  createTool('crypto', 'password-strength-checker', '密码强度', '检测密码强度。', {
    placeholder: '输入要检测的密码',
    fields: [{ key: 'minLength', label: '最低长度要求', type: 'number', defaultValue: '12' }],
  }),
]

const devTools: ToolDefinition[] = [
  createTool('dev', 'regex-tester', '正则测试', '测试正则表达式。', {
    inputLabel: '待匹配文本',
    placeholder: '输入要匹配的文本',
    fields: [
      { key: 'pattern', label: '正则表达式', type: 'text', placeholder: '如 \\d+ 或 [a-z]+' },
      { key: 'flags', label: '标志', type: 'text', defaultValue: 'g', placeholder: 'g, i, m' },
    ],
  }),
  createTool('dev', 'regex-generator', '正则生成', '按规则快速生成正则表达式。', {
    mode: 'generator',
    fields: [
      {
        key: 'preset',
        label: '模板',
        type: 'select',
        defaultValue: 'email',
        options: [
          { value: 'email', label: '邮箱' },
          { value: 'phone-cn', label: '手机号（中国）' },
          { value: 'url', label: 'URL' },
          { value: 'ipv4', label: 'IPv4' },
          { value: 'username', label: '用户名（字母数字下划线）' },
          { value: 'digits', label: '纯数字' },
          { value: 'custom', label: '自定义片段组合' },
        ],
      },
      { key: 'min', label: '最小长度', type: 'number', defaultValue: '1' },
      { key: 'max', label: '最大长度', type: 'number', defaultValue: '16' },
      { key: 'allowUpper', label: '允许大写', type: 'checkbox', defaultValue: true },
      { key: 'allowLower', label: '允许小写', type: 'checkbox', defaultValue: true },
      { key: 'allowDigits', label: '允许数字', type: 'checkbox', defaultValue: true },
      { key: 'allowUnderscore', label: '允许下划线', type: 'checkbox', defaultValue: false },
      { key: 'flags', label: '标志', type: 'text', defaultValue: '', placeholder: '如 i、gm' },
    ],
  }),
  createTool('dev', 'http-request-tester', 'HTTP 请求测试', '发送 HTTP 请求。', {
    frontend: false,
    inputLabel: '请求 URL',
    placeholder: 'https://api.example.com/...',
    fields: [
      { key: 'method', label: '方法', type: 'select', defaultValue: 'GET', options: [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }, { value: 'DELETE', label: 'DELETE' }, { value: 'HEAD', label: 'HEAD' }] },
      { key: 'headers', label: '请求头', type: 'textarea', defaultValue: '', placeholder: 'Content-Type: application/json\nAuthorization: Bearer ...' },
      { key: 'body', label: '请求体', type: 'textarea', defaultValue: '', placeholder: 'POST/PUT 时填写 JSON 或文本' },
    ],
  }),
  createTool('dev', 'api-tester', 'API 测试', '调试 HTTP 接口。', {
    frontend: false,
    inputLabel: '请求 URL',
    placeholder: 'https://api.example.com/...',
    fields: [
      { key: 'method', label: '方法', type: 'select', defaultValue: 'GET', options: [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }, { value: 'DELETE', label: 'DELETE' }, { value: 'HEAD', label: 'HEAD' }] },
      { key: 'headers', label: '请求头', type: 'textarea', defaultValue: '', placeholder: 'Content-Type: application/json\nAuthorization: Bearer ...' },
      { key: 'body', label: '请求体', type: 'textarea', defaultValue: '', placeholder: 'POST/PUT 时填写 JSON 或文本' },
    ],
  }),
  createTool('dev', 'http-header-checker', 'HTTP 头查看', '查看响应头。', { frontend: false }),
  createTool('dev', 'user-agent-parser', 'User-Agent 解析', '解析 UA 字符串。', { placeholder: '粘贴 User-Agent 字符串' }),
  createTool('dev', 'uuid-generator', 'UUID 生成', '生成 UUID。', { mode: 'generator', placeholder: '' }),
  createTool('dev', 'timestamp-converter', '时间戳转换', '时间戳与日期互转。', {
    placeholder: '输入时间戳（秒/毫秒）或 ISO 日期',
    fields: [{ key: 'mode', label: '模式', type: 'select', defaultValue: 'auto', options: [{ value: 'auto', label: '自动' }, { value: 'timestamp-to-date', label: '时间戳→日期' }, { value: 'date-to-timestamp', label: '日期→时间戳' }] }],
  }),
  createTool('dev', 'cron-expression-generator', 'Cron 表达式', '生成 Cron 表达式。', {
    frontend: false,
    mode: 'generator',
    fields: [
      { key: 'minute', label: '分', type: 'text', defaultValue: '*', placeholder: '* 或 0-59' },
      { key: 'hour', label: '时', type: 'text', defaultValue: '*', placeholder: '* 或 0-23' },
      { key: 'dayOfMonth', label: '日', type: 'text', defaultValue: '*', placeholder: '* 或 1-31' },
      { key: 'month', label: '月', type: 'text', defaultValue: '*', placeholder: '* 或 1-12' },
      { key: 'dayOfWeek', label: '周', type: 'text', defaultValue: '*', placeholder: '* 或 0-6 (0=周日)' },
    ],
  }),
  createTool('dev', 'curl-to-fetch-converter', 'Curl 转 Fetch', '将 curl 转为 fetch 代码。', { placeholder: '粘贴 curl 命令' }),
  createTool('dev', 'curl-to-axios-converter', 'Curl 转 Axios', '将 curl 转为 axios 代码。', { placeholder: '粘贴 curl 命令' }),
  createTool('dev', 'sql-formatter', 'SQL 格式化', '格式化 SQL。', { placeholder: '粘贴 SQL 语句' }),
  createTool('dev', 'sql-minifier', 'SQL 压缩', '压缩 SQL。', { placeholder: '粘贴 SQL 语句' }),
  createTool('dev', 'sql-to-json', 'SQL 转 JSON', '简单 INSERT SQL 转 JSON。', { placeholder: '粘贴 INSERT INTO ... VALUES 语句' }),
  createTool('dev', 'json-to-sql', 'JSON 转 SQL', 'JSON 转 INSERT SQL。', {
    placeholder: '粘贴 JSON 数组，每项为一行键值',
    fields: [{ key: 'tableName', label: '表名', type: 'text', defaultValue: 'my_table', placeholder: 'my_table' }],
  }),
  createTool('dev', 'sql-pretty-print', 'SQL 美化', '美化 SQL 语句。', { placeholder: '粘贴 SQL 语句' }),
  createTool('dev', 'sql-schema-generator', 'SQL Schema 生成', '根据示例生成建表语句。', {
    placeholder: '粘贴 JSON 示例（单条或数组首条）',
    fields: [
      { key: 'tableName', label: '表名', type: 'text', defaultValue: 'my_table' },
      { key: 'dialect', label: '方言', type: 'select', defaultValue: 'mysql', options: [{ value: 'mysql', label: 'MySQL' }, { value: 'pg', label: 'PostgreSQL' }] },
    ],
  }),
  createTool('dev', 'mongo-query-formatter', 'Mongo 查询格式化', '格式化 MongoDB 查询。', { placeholder: '粘贴 MongoDB 查询 JSON' }),
  createTool('dev', 'jwt-decoder', 'JWT 解码', '解码并查看 JWT 载荷。', { placeholder: '粘贴 JWT 字符串' }),
]

const textTools: ToolDefinition[] = [
  createTool('text', 'word-counter', '字数统计', '统计字数、词数。'),
  createTool('text', 'character-counter', '字符统计', '统计字符数。'),
  createTool('text', 'text-sorter', '文本排序', '按行排序。'),
  createTool('text', 'text-deduplicator', '文本去重', '按行去重。'),
  createTool('text', 'text-diff-checker', '文本对比', '对比两段文本。', {
    mode: 'compare',
    inputLabel: '文本 A',
    secondaryInputLabel: '文本 B',
    placeholder: '第一段文本',
    secondaryPlaceholder: '第二段文本',
  }),
  createTool('text', 'case-converter', '大小写转换', '转换英文大小写。', {
    placeholder: '输入英文文本',
    fields: [{ key: 'caseMode', label: '输出格式', type: 'select', defaultValue: 'all', options: [{ value: 'all', label: '全部展示' }, { value: 'lower', label: '全小写' }, { value: 'upper', label: '全大写' }, { value: 'title', label: '首字母大写' }, { value: 'camel', label: '驼峰' }, { value: 'snake', label: '下划线' }, { value: 'kebab', label: '连字符' }] }],
  }),
  createTool('text', 'remove-line-breaks', '移除换行', '合并为一行。', { placeholder: '输入多行文本' }),
  createTool('text', 'remove-duplicate-lines', '移除重复行', '删除重复行。', { placeholder: '每行一条，重复行将只保留一条' }),
  createTool('text', 'random-text-generator', '随机文本', '生成随机字符串。', {
    mode: 'generator',
    fields: [{ key: 'length', label: '长度', type: 'number', defaultValue: '16' }],
  }),
  createTool('text', 'lorem-ipsum-generator', 'Lorem Ipsum', '生成占位段落。', {
    mode: 'generator',
    fields: [{ key: 'paragraphs', label: '段落数', type: 'number', defaultValue: '3' }],
  }),
  createTool('text', 'random-name-generator', '随机姓名', '生成随机中文/英文姓名。', {
    mode: 'generator',
    fields: [
      { key: 'count', label: '数量', type: 'number', defaultValue: '10' },
      { key: 'locale', label: '语言', type: 'select', defaultValue: 'zh', options: [{ value: 'zh', label: '中文' }, { value: 'en', label: '英文' }, { value: 'mixed', label: '混合' }] },
    ],
  }),
  createTool('text', 'random-json-generator', '随机 JSON', '按模板生成随机 JSON 数组。', {
    mode: 'generator',
    fields: [
      { key: 'count', label: '条数', type: 'number', defaultValue: '5' },
      { key: 'keys', label: '字段（名:类型）', type: 'text', defaultValue: 'id,name:string,value:number,active:boolean', placeholder: 'name:string,age:int' },
    ],
  }),
]

const imageTools: ToolDefinition[] = [
  createTool('image', 'image-compressor', '图片压缩', '压缩图片并导出新文件。', {
    mode: 'generator',
    fields: [
      { key: 'file', label: '图片文件', type: 'file', accept: 'image/*' },
      { key: 'quality', label: '质量（0-1）', type: 'number', defaultValue: '0.8' },
      {
        key: 'format',
        label: '输出格式',
        type: 'select',
        defaultValue: 'image/jpeg',
        options: [
          { value: 'image/jpeg', label: 'JPEG' },
          { value: 'image/webp', label: 'WEBP' },
          { value: 'image/png', label: 'PNG' },
        ],
      },
      { key: 'maxWidth', label: '最大宽度（可选）', type: 'number', placeholder: '如 1920' },
      { key: 'maxHeight', label: '最大高度（可选）', type: 'number', placeholder: '如 1080' },
    ],
  }),
  createTool('image', 'image-resizer', '图片缩放', '按指定宽高缩放图片。', {
    mode: 'generator',
    fields: [
      { key: 'file', label: '图片文件', type: 'file', accept: 'image/*' },
      { key: 'width', label: '目标宽度', type: 'number', defaultValue: '800' },
      { key: 'height', label: '目标高度', type: 'number', defaultValue: '600' },
      {
        key: 'fit',
        label: '缩放模式',
        type: 'select',
        defaultValue: 'contain',
        options: [
          { value: 'contain', label: '完整展示（留白）' },
          { value: 'cover', label: '铺满（可能裁切）' },
          { value: 'fill', label: '拉伸填充' },
        ],
      },
      {
        key: 'format',
        label: '输出格式',
        type: 'select',
        defaultValue: 'image/png',
        options: [
          { value: 'image/png', label: 'PNG' },
          { value: 'image/jpeg', label: 'JPEG' },
          { value: 'image/webp', label: 'WEBP' },
        ],
      },
    ],
  }),
  createTool('image', 'image-cropper', '图片裁剪', '按坐标裁剪图片区域。', {
    mode: 'generator',
    fields: [
      { key: 'file', label: '图片文件', type: 'file', accept: 'image/*' },
      { key: 'x', label: '起点 X', type: 'number', defaultValue: '0' },
      { key: 'y', label: '起点 Y', type: 'number', defaultValue: '0' },
      { key: 'width', label: '裁剪宽度', type: 'number', defaultValue: '300' },
      { key: 'height', label: '裁剪高度', type: 'number', defaultValue: '300' },
      {
        key: 'format',
        label: '输出格式',
        type: 'select',
        defaultValue: 'image/png',
        options: [
          { value: 'image/png', label: 'PNG' },
          { value: 'image/jpeg', label: 'JPEG' },
          { value: 'image/webp', label: 'WEBP' },
        ],
      },
    ],
  }),
  createTool('image', 'image-base64-converter', '图片/Base64 转换', '图片与 Base64 双向转换。', {
    mode: 'generator',
    inputLabel: 'Base64 内容',
    placeholder: '粘贴图片 Base64 或 data:image/...;base64,...',
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'image-to-base64',
        options: [
          { value: 'image-to-base64', label: '图片 → Base64' },
          { value: 'base64-to-image', label: 'Base64 → 图片' },
        ],
      },
      { key: 'file', label: '图片文件', type: 'file', accept: 'image/*' },
      { key: 'filename', label: '文件名（可选）', type: 'text', placeholder: 'example.png' },
    ],
  }),
  createTool('image', 'image-format-converter', '图片格式转换', '转换图片格式并下载。', {
    mode: 'generator',
    fields: [
      { key: 'file', label: '图片文件', type: 'file', accept: 'image/*' },
      {
        key: 'targetFormat',
        label: '目标格式',
        type: 'select',
        defaultValue: 'image/png',
        options: [
          { value: 'image/png', label: 'PNG' },
          { value: 'image/jpeg', label: 'JPEG' },
          { value: 'image/webp', label: 'WEBP' },
        ],
      },
      { key: 'quality', label: '质量（JPEG/WEBP）', type: 'number', defaultValue: '0.9' },
    ],
  }),
  createTool('image', 'qr-code-generator', '二维码生成', '生成二维码。', { placeholder: '输入要编码的内容（留空则生成空格）' }),
  createTool('image', 'qr-code-decoder', '二维码解码', '从文本/图片解码二维码内容。', { placeholder: '粘贴二维码内容字符串（如 WIFI:... 或任意文本）' }),
  createTool('image', 'wifi-qr-generator', 'WiFi 二维码', '生成 WiFi 连接二维码。', {
    mode: 'generator',
    fields: [
      { key: 'ssid', label: 'WiFi 名称（SSID）', type: 'text', placeholder: '必填' },
      { key: 'password', label: '密码', type: 'password', placeholder: '选填' },
      { key: 'encryption', label: '加密方式', type: 'select', defaultValue: 'WPA', options: [{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: '无' }] },
      { key: 'hidden', label: '隐藏网络', type: 'checkbox', defaultValue: false },
    ],
  }),
  createTool('image', 'qr-code-scanner', '二维码识别', '从图片识别二维码内容。', {
    mode: 'generator',
    fields: [{ key: 'file', label: '二维码图片', type: 'file', accept: 'image/*' }],
  }),
  createTool('image', 'image-metadata-viewer', '图片元信息', '上传图片后查看文件名、格式、尺寸、大小等元数据。', {
    frontend: false,
    mode: 'generator',
    actionLabel: '查看元数据',
    fields: [{ key: 'file', label: '选择图片', type: 'file', accept: 'image/*' }],
  }),
  createTool('image', 'screenshot-to-pdf', '截图转 PDF', '将截图图片转换为 PDF。', {
    frontend: false,
    mode: 'generator',
    fields: [{ key: 'file', label: '截图文件', type: 'file', accept: 'image/*' }],
  }),
]

const docTools: ToolDefinition[] = [
  createTool('doc', 'epub-to-pdf', 'EPUB 转 PDF', '将 EPUB 转为 PDF。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'EPUB 文件', type: 'file', accept: '.epub,application/epub+zip' }] }),
  createTool('doc', 'pdf-to-epub', 'PDF 转 EPUB', '将 PDF 转为 EPUB。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'PDF 文件', type: 'file', accept: '.pdf,application/pdf' }] }),
  createTool('doc', 'azw3-to-pdf', 'AZW3 转 PDF', '将 AZW3 转为 PDF。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'AZW3 文件', type: 'file' }] }),
  createTool('doc', 'pdf-to-azw3', 'PDF 转 AZW3', '将 PDF 转为 AZW3。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'PDF 文件', type: 'file' }] }),
  createTool('doc', 'docx-to-pdf', 'DOCX 转 PDF', '将 DOCX 转为 PDF。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'DOCX 文件', type: 'file' }] }),
  createTool('doc', 'pdf-to-docx', 'PDF 转 DOCX', '将 PDF 转为 DOCX。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'PDF 文件', type: 'file' }] }),
  createTool('doc', 'txt-to-pdf', 'TXT 转 PDF', '将文本转为 PDF。', {
    frontend: false,
    inputLabel: '待转换文本',
    placeholder: '输入要转为 PDF 的文本内容',
  }),
  createTool('doc', 'pdf-to-txt', 'PDF 转 TXT', '从 PDF 提取文本。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'PDF 文件', type: 'file' }] }),
]

const fileTools: ToolDefinition[] = [
  createTool('file', 'file-hash-checker', '文件哈希校验', '校验文件哈希。', {
    frontend: false,
    mode: 'generator',
    fields: [
      { key: 'file', label: '选择文件', type: 'file' },
      { key: 'algorithm', label: '算法', type: 'select', defaultValue: 'sha256', options: [{ value: 'md5', label: 'MD5' }, { value: 'sha1', label: 'SHA1' }, { value: 'sha256', label: 'SHA256' }, { value: 'sha512', label: 'SHA512' }] },
      { key: 'expectedHash', label: '期望的哈希值', type: 'text', placeholder: '粘贴要对比的哈希字符串' },
    ],
  }),
  createTool('file', 'file-size-converter', '文件大小换算', '换算文件大小单位。', {
    placeholder: '输入数值（如 1024）',
    fields: [{ key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'MB', options: [{ value: 'B', label: 'B' }, { value: 'KB', label: 'KB' }, { value: 'MB', label: 'MB' }, { value: 'GB', label: 'GB' }, { value: 'TB', label: 'TB' }] }],
  }),
  createTool('file', 'zip-compressor', 'ZIP 压缩', '将文件压缩为 ZIP。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: '选择文件', type: 'file' }] }),
  createTool('file', 'zip-extractor', 'ZIP 解压', '解压 ZIP 文件。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'ZIP 文件', type: 'file', accept: '.zip,application/zip' }] }),
  createTool('file', 'pdf-merger', 'PDF 合并', '合并多个 PDF。', { frontend: false, mode: 'generator', fields: [{ key: 'files', label: 'PDF 文件', type: 'file', multiple: true, accept: '.pdf' }] }),
  createTool('file', 'pdf-splitter', 'PDF 拆分', '按页拆分 PDF。', { frontend: false, mode: 'generator', fields: [{ key: 'file', label: 'PDF 文件', type: 'file', accept: '.pdf,application/pdf' }] }),
  createTool('file', 'file-base64-converter', '文件/Base64 转换', '文件与 Base64 双向转换。', {
    mode: 'generator',
    inputLabel: 'Base64 内容',
    placeholder: '粘贴 Base64 或 data:...;base64,...',
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'file-to-base64',
        options: [
          { value: 'file-to-base64', label: '文件 → Base64' },
          { value: 'base64-to-file', label: 'Base64 → 文件' },
        ],
      },
      { key: 'file', label: '文件', type: 'file' },
      { key: 'filename', label: '文件名（可选）', type: 'text', placeholder: 'output.bin' },
      { key: 'mimeType', label: 'MIME（可选）', type: 'text', placeholder: 'application/octet-stream' },
    ],
  }),
]

const dateTools: ToolDefinition[] = [
  createTool('date', 'timestamp-date-converter', '时间戳/日期转换', '时间戳与日期双向转换。', {
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'timestamp-to-date',
        options: [
          { value: 'timestamp-to-date', label: '时间戳 → 日期' },
          { value: 'date-to-timestamp', label: '日期 → 时间戳' },
        ],
      },
    ],
    placeholder: '输入时间戳（秒/毫秒）或日期字符串',
  }),
  createTool('date', 'time-zone-converter', '时区转换', '转换时区。', {
    placeholder: '输入日期时间（如 2025-01-01 12:00 或 ISO 字符串）',
    fields: [
      { key: 'fromTimeZone', label: '源时区', type: 'text', defaultValue: 'UTC', placeholder: 'UTC' },
      { key: 'toTimeZone', label: '目标时区', type: 'text', defaultValue: 'Asia/Shanghai', placeholder: 'Asia/Shanghai' },
    ],
  }),
  createTool('date', 'unix-time-converter', 'Unix 时间', '秒/毫秒互转。', { placeholder: '输入时间戳（秒或毫秒）' }),
  createTool('date', 'age-calculator', '年龄计算', '根据生日计算年龄。', { placeholder: '输入生日（如 1990-01-01）' }),
  createTool('date', 'countdown-timer-generator', '倒计时', '生成倒计时元数据。', { placeholder: '输入目标日期时间（如 2025-12-31T23:59:59）' }),
  createTool('date', 'working-days-calculator', '工作日计算', '计算区间内工作日。', { mode: 'generator', fields: [{ key: 'startDate', label: '开始日期', type: 'date' }, { key: 'endDate', label: '结束日期', type: 'date' }] }),
  createTool('date', 'random-date-generator', '随机日期', '在区间内随机日期。', { mode: 'generator', fields: [{ key: 'startDate', label: '开始日期', type: 'date' }, { key: 'endDate', label: '结束日期', type: 'date' }] }),
]

const networkTools: ToolDefinition[] = [
  createTool('network', 'ip-lookup', 'IP 查询', '查询 IP 信息。', { frontend: false, inputLabel: 'IP 地址', placeholder: '输入 IP 地址' }),
  createTool('network', 'dns-lookup', 'DNS 查询', '解析 DNS。', { frontend: false, inputLabel: '域名', placeholder: '输入域名' }),
  createTool('network', 'whois-lookup', 'Whois 查询', 'Whois 查询。', { frontend: false, inputLabel: '域名', placeholder: '输入域名' }),
  createTool('network', 'port-checker', '端口检测', '检测端口是否开放。', {
    frontend: false,
    inputLabel: '主机或 IP',
    placeholder: '输入主机名或 IP',
    fields: [{ key: 'port', label: '端口', type: 'number', defaultValue: '80' }],
  }),
  createTool('network', 'http-status-checker', 'HTTP 状态', '检测网站 HTTP 状态。'),
  createTool('network', 'http-status-code-lookup', 'HTTP 状态码查询', '查询 HTTP 状态码含义。'),
  createTool('network', 'url-parser', 'URL 解析', '解析 URL 结构。'),
  createTool('network', 'url-slug-generator', 'URL Slug 生成', '将标题转为 URL 友好 slug。'),
  createTool('network', 'domain-extractor', '域名提取', '从文本中提取域名。'),
  createTool('network', 'url-shortener', '短链生成', '生成可分享的短链接（本地模拟）。', {
    mode: 'generator',
    fields: [
      { key: 'baseUrl', label: '短链域名', type: 'text', defaultValue: 'https://short.local' },
      { key: 'customCode', label: '自定义短码（可选）', type: 'text', placeholder: '如 my-link' },
      { key: 'length', label: '随机短码长度', type: 'number', defaultValue: '7' },
    ],
  }),
]

const colorTools: ToolDefinition[] = [
  createTool('color', 'hex-to-rgb', 'Hex 转 RGB', '十六进制颜色转 RGB。'),
  createTool('color', 'rgb-to-hex', 'RGB 转 Hex', 'RGB 转十六进制颜色。'),
  createTool('color', 'hsl-converter', 'HSL 转换', 'HSL 与 Hex/RGB 互转。'),
  createTool('color', 'random-color-generator', '随机颜色', '生成随机颜色值。'),
]

const convertTools: ToolDefinition[] = [
  createTool('convert', 'length-converter', '长度换算', '米、英尺、英寸等长度单位换算。', {
    placeholder: '输入数值（如 12.5）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'm', options: lengthUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'cm', options: lengthUnitOptions },
    ],
  }),
  createTool('convert', 'weight-converter', '重量换算', '千克、克、磅等重量单位换算。', {
    placeholder: '输入数值（如 3.2）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'kg', options: weightUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'g', options: weightUnitOptions },
    ],
  }),
  createTool('convert', 'temperature-converter', '温度换算', '摄氏度、华氏度等换算。', {
    placeholder: '输入温度数值（如 36.5）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'C', options: temperatureUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'F', options: temperatureUnitOptions },
    ],
  }),
  createTool('convert', 'speed-converter', '速度换算', '千米/时、米/秒等换算。', {
    placeholder: '输入速度数值（如 88）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'km/h', options: speedUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'm/s', options: speedUnitOptions },
    ],
  }),
  createTool('convert', 'data-size-converter', '数据大小换算', 'KB、MB、GB 等换算。', {
    placeholder: '输入大小数值（如 1024）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'MB', options: dataSizeUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'GB', options: dataSizeUnitOptions },
    ],
  }),
  createTool('convert', 'energy-converter', '能量换算', '焦耳、卡路里等换算。', {
    placeholder: '输入能量数值（如 1500）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'kJ', options: energyUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'kcal', options: energyUnitOptions },
    ],
  }),
  createTool('convert', 'angle-converter', '角度换算', '度与弧度互转。', {
    placeholder: '输入角度数值（如 180）',
    fields: [
      { key: 'fromUnit', label: '原单位', type: 'select', defaultValue: 'deg', options: angleUnitOptions },
      { key: 'toUnit', label: '目标单位', type: 'select', defaultValue: 'rad', options: angleUnitOptions },
    ],
  }),
]

const randomTools: ToolDefinition[] = [
  createTool('random', 'random-number-generator', '随机数生成', '生成指定范围随机数。', {
    mode: 'generator',
    fields: [
      { key: 'min', label: '最小值', type: 'number', defaultValue: '0' },
      { key: 'max', label: '最大值', type: 'number', defaultValue: '100' },
      { key: 'integer', label: '整数结果', type: 'checkbox', defaultValue: true },
    ],
  }),
  createTool('random', 'random-string-generator', '随机字符串', '生成随机字符串。', {
    mode: 'generator',
    fields: [
      { key: 'length', label: '长度', type: 'number', defaultValue: '16' },
      { key: 'charset', label: '字符集', type: 'select', defaultValue: 'alnum', options: randomCharsetOptions },
      { key: 'customCharset', label: '自定义字符集', type: 'text', placeholder: '仅在选择“自定义”时生效' },
    ],
  }),
  createTool('random', 'random-uuid-generator', '随机 UUID', '批量生成 UUID。', {
    mode: 'generator',
    fields: [{ key: 'count', label: '数量', type: 'number', defaultValue: '10' }],
  }),
  createTool('random', 'nanoid-generator', 'NanoID 生成', '生成 NanoID。', {
    mode: 'generator',
    fields: [
      { key: 'length', label: '长度', type: 'number', defaultValue: '21' },
      { key: 'count', label: '数量', type: 'number', defaultValue: '10' },
    ],
  }),
]

const webTools: ToolDefinition[] = [
  createTool('web', 'html-formatter', 'HTML 格式化', '格式化 HTML 代码。'),
  createTool('web', 'html-minifier', 'HTML 压缩', '压缩 HTML。'),
  createTool('web', 'css-formatter', 'CSS 格式化', '格式化 CSS。'),
  createTool('web', 'css-minifier', 'CSS 压缩', '压缩 CSS。'),
  createTool('web', 'js-formatter', 'JS 格式化', '格式化 JavaScript。'),
  createTool('web', 'js-minifier', 'JS 压缩', '压缩 JavaScript。'),
  createTool('web', 'css-to-js-converter', 'CSS 转 JS', '将 CSS 转为 JS 对象。'),
  createTool('web', 'markdown-html-converter', 'Markdown/HTML 转换', 'Markdown 与 HTML 双向转换。', {
    fields: [
      {
        key: 'mode',
        label: '转换方向',
        type: 'select',
        defaultValue: 'markdown-to-html',
        options: [
          { value: 'markdown-to-html', label: 'Markdown → HTML' },
          { value: 'html-to-markdown', label: 'HTML → Markdown' },
        ],
      },
    ],
    placeholder: '输入 Markdown 或 HTML',
  }),
  createTool('web', 'markdown-preview', 'Markdown 预览', '预览 Markdown 渲染效果。'),
  createTool('web', 'markdown-table-generator', 'Markdown 表格', '生成 Markdown 表格。', {
    mode: 'generator',
    fields: [
      { key: 'columns', label: '表头列名', type: 'text', defaultValue: '列1,列2', placeholder: '列1,列2,列3' },
      { key: 'rows', label: '行数', type: 'number', defaultValue: '3' },
    ],
  }),
  createTool('web', 'markdown-cheat-sheet', 'Markdown 速查', 'Markdown 语法速查。'),
]

const seoTools: ToolDefinition[] = [
  createTool('seo', 'meta-tag-generator', 'Meta 标签生成', '生成 SEO meta 标签。', {
    mode: 'generator',
    fields: [
      { key: 'title', label: '页面标题', type: 'text', defaultValue: '示例页面标题' },
      { key: 'description', label: '页面描述', type: 'textarea', defaultValue: '这里是一段页面描述，用于 SEO 展示摘要。' },
      { key: 'keywords', label: '关键词', type: 'text', defaultValue: '关键词1,关键词2' },
    ],
  }),
  createTool('seo', 'robots-generator', 'Robots.txt 生成', '生成 robots.txt 内容。', {
    mode: 'generator',
    fields: [
      { key: 'allow', label: 'Allow', type: 'text', defaultValue: '/' },
      { key: 'disallow', label: 'Disallow', type: 'text', defaultValue: '' },
    ],
  }),
  createTool('seo', 'sitemap-generator', 'Sitemap 生成', '生成 sitemap 片段。', {
    mode: 'generator',
    fields: [
      { key: 'baseUrl', label: '站点地址', type: 'text', defaultValue: 'https://example.com' },
      { key: 'paths', label: '追加路径', type: 'textarea', defaultValue: '/about,/contact' },
    ],
  }),
  createTool('seo', 'open-graph-generator', 'Open Graph 生成', '生成 OG 等社交标签。', {
    mode: 'generator',
    fields: [
      { key: 'title', label: '页面标题', type: 'text', defaultValue: '示例页面标题' },
      { key: 'description', label: '页面描述', type: 'textarea', defaultValue: '这里是一段用于社交分享的描述。' },
      { key: 'url', label: '页面 URL', type: 'text', defaultValue: 'https://example.com' },
      { key: 'image', label: '图片 URL', type: 'text', defaultValue: 'https://example.com/og-image.png' },
    ],
  }),
  createTool('seo', 'keyword-density-checker', '关键词密度', '检测关键词密度。'),
  createTool('seo', 'html-tag-analyzer', 'HTML 标签分析', '分析页面标签结构。'),
]

const logTools: ToolDefinition[] = [
  createTool('log', 'log-formatter', '日志格式化', '格式化 JSON 等日志。'),
  createTool('log', 'log-analyzer', '日志分析', '统计日志级别与示例。'),
  createTool('log', 'stack-trace-parser', '堆栈解析', '解析 JavaScript 堆栈。'),
]

const gitTools: ToolDefinition[] = [
  createTool('git', 'git-ignore-generator', 'Gitignore 生成', '生成 .gitignore 内容。', {
    mode: 'generator',
    fields: [
      { key: 'targets', label: '目标环境', type: 'textarea', placeholder: 'node,macos,windows' },
    ],
  }),
  createTool('git', 'git-commit-message-generator', 'Commit 信息生成', '生成规范 commit 信息。', {
    mode: 'generator',
    fields: [
      {
        key: 'type',
        label: '类型',
        type: 'select',
        defaultValue: 'feat',
        options: [
          { value: 'feat', label: 'feat 功能' },
          { value: 'fix', label: 'fix 修复' },
          { value: 'docs', label: 'docs 文档' },
          { value: 'style', label: 'style 格式' },
          { value: 'refactor', label: 'refactor 重构' },
          { value: 'perf', label: 'perf 性能' },
          { value: 'test', label: 'test 测试' },
          { value: 'chore', label: 'chore 其他' },
          { value: 'ci', label: 'ci 持续集成' },
          { value: 'build', label: 'build 构建' },
          { value: 'revert', label: 'revert 回滚' },
        ],
      },
      { key: 'scope', label: '范围（可选）', type: 'text', placeholder: '例如 auth 或 ui' },
      { key: 'subject', label: '简要说明', type: 'text', placeholder: '不超过 50 字' },
      { key: 'body', label: '详细说明（可选）', type: 'textarea' },
    ],
  }),
  createTool('git', 'git-diff-viewer', 'Diff 查看', '对比两段文本差异。'),
  createTool('git', 'git-patch-viewer', 'Patch 查看', '解析并展示 Patch。'),
]

export const toolCategories: ToolCategory[] = [
  { key: 'json', title: 'JSON / 数据格式', description: 'JSON、XML、CSV、YAML 等格式转换与验证。', icon: <CodeOutlined />, color: CATEGORY_COLORS.json, tools: jsonTools },
  { key: 'encode', title: '编码 / 解码', description: 'Base64、URL、HTML、Unicode 等编码处理。', icon: <DeploymentUnitOutlined />, color: CATEGORY_COLORS.encode, tools: encodeTools },
  { key: 'crypto', title: '加密 / 哈希', description: 'MD5、SHA、HMAC、AES、密码等。', icon: <LockOutlined />, color: CATEGORY_COLORS.crypto, tools: cryptoTools },
  { key: 'dev', title: '开发工具', description: '正则、SQL、时间戳、UUID、Curl 等。', icon: <CodeOutlined />, color: CATEGORY_COLORS.dev, tools: devTools },
  { key: 'text', title: '文本处理', description: '统计、排序、去重、Diff、生成。', icon: <FontSizeOutlined />, color: CATEGORY_COLORS.text, tools: textTools },
  { key: 'image', title: '图片工具', description: '压缩、裁剪、二维码、Base64。', icon: <PictureOutlined />, color: CATEGORY_COLORS.image, tools: imageTools },
  { key: 'doc', title: '文档转换', description: 'EPUB、AZW3、DOCX、TXT 与 PDF 互转。', icon: <FileTextOutlined />, color: CATEGORY_COLORS.doc, tools: docTools },
  { key: 'file', title: '文件工具', description: '哈希、ZIP、PDF 合并拆分、Base64。', icon: <FileOutlined />, color: CATEGORY_COLORS.file, tools: fileTools },
  { key: 'date', title: '日期时间', description: '时间戳、时区、年龄、工作日、随机日期。', icon: <CalendarOutlined />, color: CATEGORY_COLORS.date, tools: dateTools },
  { key: 'network', title: '网络工具', description: 'IP、DNS、Whois、HTTP 状态、URL 解析。', icon: <GlobalOutlined />, color: CATEGORY_COLORS.network, tools: networkTools },
  { key: 'color', title: '颜色工具', description: 'Hex、RGB、HSL 转换与随机颜色。', icon: <BgColorsOutlined />, color: CATEGORY_COLORS.color, tools: colorTools },
  { key: 'convert', title: '单位换算', description: '长度、重量、温度、速度、数据大小等。', icon: <SwapOutlined />, color: CATEGORY_COLORS.convert, tools: convertTools },
  { key: 'random', title: '随机生成', description: '随机数、字符串、UUID、NanoID。', icon: <ThunderboltOutlined />, color: CATEGORY_COLORS.random, tools: randomTools },
  { key: 'web', title: '网页/代码', description: 'HTML/CSS/JS/Markdown 格式化与转换。', icon: <EditOutlined />, color: CATEGORY_COLORS.web, tools: webTools },
  { key: 'seo', title: 'SEO 工具', description: 'Meta、Robots、Sitemap、OG、关键词分析。', icon: <RiseOutlined />, color: CATEGORY_COLORS.seo, tools: seoTools },
  { key: 'log', title: '日志工具', description: '日志格式化、分析与堆栈解析。', icon: <ProfileOutlined />, color: CATEGORY_COLORS.log, tools: logTools },
  { key: 'git', title: 'Git 工具', description: 'Gitignore、Commit 信息、Diff、Patch。', icon: <BranchesOutlined />, color: CATEGORY_COLORS.git, tools: gitTools },
]

export const allTools = toolCategories.flatMap((category) => category.tools)

export const toolMap = Object.fromEntries(allTools.map((tool) => [tool.id, tool]))
