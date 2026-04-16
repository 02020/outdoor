import { Router } from 'express'
import { authGuard } from '../middleware/auth'
import * as statsService from '../services/stats'
import { ok } from '../utils/response'

export const statsRouter = Router()

statsRouter.use(authGuard)

/** GET /api/stats - 群组统计概览 */
statsRouter.get('/', (req, res) => {
  const data = statsService.getStats(req.auth!.groupId)
  ok(res, data)
})

/** GET /api/transactions - 群组交易流水 */
statsRouter.get('/transactions', (req, res) => {
  const memberId = req.query.memberId ? Number(req.query.memberId) : undefined
  const data = statsService.getTransactions(req.auth!.groupId, memberId)
  ok(res, data)
})
