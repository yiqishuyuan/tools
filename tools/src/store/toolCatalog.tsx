import type { ReactNode } from 'react'
import {
  DashboardOutlined,
  CodeOutlined,
  PictureOutlined,
  ToolOutlined,
  FileTextOutlined,
  FolderOutlined,
} from '@ant-design/icons'

export type ToolLink = {
  name: string
  path: string
}

export type ToolCategory = {
  key: string
  title: string
  desc: string
  path: string
  menuIcon: ReactNode
  dashboardIcon: ReactNode
  tools: ToolLink[]
}

export const toolCategories: ToolCategory[] = [
  {
    key: 'json',
    title: 'JSON 工具',
    desc: '格式化、压缩、校验、转 CSV/XML',
    path: '/json/format',
    menuIcon: <CodeOutlined />,
    dashboardIcon: <CodeOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    tools: [
      { name: 'JSON 格式化', path: '/json/format' },
      { name: 'JSON 压缩', path: '/json/minify' },
      { name: 'JSON 校验', path: '/json/validate' },
      { name: 'JSON 格式转换', path: '/json/convert' },
    ],
  },
  {
    key: 'image',
    title: '图片工具',
    desc: '压缩、裁剪、二维码',
    path: '/image/compress',
    menuIcon: <PictureOutlined />,
    dashboardIcon: <PictureOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    tools: [
      { name: '图片压缩', path: '/image/compress' },
      { name: '图片裁剪', path: '/image/crop' },
      { name: '生成二维码', path: '/image/qrcode' },
    ],
  },
  {
    key: 'dev',
    title: '开发工具',
    desc: '正则、代码高亮、接口调试',
    path: '/dev/regex',
    menuIcon: <ToolOutlined />,
    dashboardIcon: <ToolOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    tools: [
      { name: '正则表达式测试', path: '/dev/regex' },
      { name: '代码高亮', path: '/dev/highlight' },
      { name: '接口调试', path: '/dev/api' },
    ],
  },
  {
    key: 'doc',
    title: '文档转换',
    desc: 'EPUB ↔ PDF 等',
    path: '/doc/convert',
    menuIcon: <FileTextOutlined />,
    dashboardIcon: <FileTextOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    tools: [{ name: 'EPUB / PDF 转换', path: '/doc/convert' }],
  },
  {
    key: 'file',
    title: '文件/文本工具',
    desc: '压缩、解压、加解密',
    path: '/file/compress',
    menuIcon: <FolderOutlined />,
    dashboardIcon: <FolderOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    tools: [
      { name: '文件压缩', path: '/file/compress' },
      { name: '文件解压', path: '/file/extract' },
      { name: '文本加解密', path: '/file/text-crypto' },
      { name: '文件加解密', path: '/file/file-crypto' },
    ],
  },
]

export const navigationItems = [
  { key: '/', label: '首页', path: '/', icon: <DashboardOutlined /> },
  ...toolCategories.map((category) => ({
    key: category.key,
    label: category.title,
    icon: category.menuIcon,
    children: category.tools,
  })),
]

