import { Card, Typography, Alert } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

export default function DocConvert() {
  return (
    <div>
      <Typography.Title level={3}>文档转换（EPUB / PDF）</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        EPUB 与 PDF 互转等功能通常需要后端服务，这里提供使用说明占位。部署时可接入 Node.js 服务（pdf-lib、epub-gen 等）。
      </Typography.Text>
      <Card>
        <Alert
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          message="功能说明"
          description="建议后端提供文档上传接口，使用 pdf-lib / epub-gen / pdfkit 等库进行 EPUB↔PDF、DOCX↔PDF、TXT↔PDF 的转换，并返回生成文件供前端下载。"
        />
      </Card>
    </div>
  )
}

