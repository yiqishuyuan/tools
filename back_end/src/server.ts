import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import app from './app.js'

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '..', '.env'),
]
const envPath = envCandidates.find((candidate) => existsSync(candidate))
if (envPath) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const port = Number(process.env.PORT || 3001)
const isVercel = Boolean(process.env.VERCEL)

export default app

async function main() {
  try {
    const server = app.listen(port, () => {
      console.log(`back_end 已启动: http://localhost:${port}`)
    })
    server.on('error', (err: NodeJS.ErrnoException) => {
      console.error('监听端口失败:', err.message)
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${port} 已被占用，可设置环境变量 PORT=其他端口 再启动`)
      }
      process.exit(1)
    })
  } catch (err) {
    console.error('启动失败:', err)
    process.exit(1)
  }
}

if (!isVercel) {
  process.on('uncaughtException', (err) => {
    console.error('未捕获异常，进程退出:', err)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    console.error('未处理的 Promise 拒绝:', reason)
    process.exit(1)
  })

  main()
}
