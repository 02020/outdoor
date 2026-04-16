import dotenv from 'dotenv'
import path from 'node:path'
dotenv.config({ path: path.join(__dirname, '../../.env') })
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { groupRouter } from './routes/groups'
import { memberRouter } from './routes/members'
import { topupRouter } from './routes/topup'
import { activityRouter } from './routes/activities'
import { statsRouter } from './routes/stats'
import { vehicleRouter } from './routes/vehicles'
import { routeRouter } from './routes/routes'
import { auditRouter } from './routes/audit'
import { importRouter } from './routes/import'

const app = express()

// 基础中间件
app.use(helmet())
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 路由挂载
app.use('/api/auth', authRouter)
app.use('/api/groups', groupRouter)
app.use('/api/members', memberRouter)
app.use('/api/topup', topupRouter)
app.use('/api/activities', activityRouter)
app.use('/api/stats', statsRouter)
app.use('/api/vehicles', vehicleRouter)
app.use('/api/routes', routeRouter)
app.use('/api/audit-logs', auditRouter)
app.use('/api/import', importRouter)

// 全局错误处理
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`[outdoor-fund] server running at http://localhost:${PORT}`)
})

export { app }
