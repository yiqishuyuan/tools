import cors from 'cors'
import express, { type Application, type Request, type Response, type NextFunction } from 'express'
import toolRoutes from './routes/toolRoutes.js'

const app: Application = express()

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'online tools!',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', toolRoutes)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error?.statusCode ?? 500

  res.status(statusCode).json({
    ok: false,
    message: error?.message ?? 'Internal server error',
  })
})

export default app



