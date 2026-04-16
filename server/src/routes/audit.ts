import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import * as auditService from '../services/audit'
import { ok } from '../utils/response'

export const auditRouter = Router()

auditRouter.use(authGuard, adminOnly)

/** GET /api/audit-logs - 审计日志列表 (管理员) */
auditRouter.get('/', (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0
    const data = auditService.listAuditLogs(req.auth!.groupId, limit, offset)
    ok(res, data)
  } catch (err) { next(err) }
})
