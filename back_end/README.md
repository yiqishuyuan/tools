# back_end

独立的 `express + node` 后端服务，负责为工具站提供统一的数据处理接口。

## 启动

```bash
npm install
npm run dev
```

默认端口：`3001`

## 接口

### 健康检查

`GET /api/health`

### 获取工具目录

`GET /api/catalog`

### 执行工具

`POST /api/execute`

请求体示例：

```json
{
  "toolId": "json-formatter",
  "input": "{\"name\":\"lily\"}",
  "options": {}
}
```

支持传入对象类输入，例如：

```json
{
  "toolId": "json-diff-tool",
  "input": {
    "left": { "a": 1 },
    "right": { "a": 2 }
  }
}
```

## 说明

- 已内置工具目录数据，方便前端自动生成路由和页面。
- 当前优先实现了文本类、JSON 类、哈希类、部分网络和日期工具。
- 图片、文件、PDF、多文件上传类工具先保留目录，后续可继续补 `multer` 和二进制处理逻辑。
