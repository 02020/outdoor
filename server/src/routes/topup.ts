import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { topupSchema } from '../validators/topup'
import * as topupService from '../services/topup'
import { ok } from '../utils/response'

export const topupRouter = Router()

// 所有路由需要登录 + 管理员
topupRouter.use(authGuard, adminOnly)

/** POST /api/topup - 手动充值 */
topupRouter.post('/', validate(topupSchema), (req, res, next) => {
  try {
    const data = topupService.topup(req.auth!.groupId, req.body)
    ok(res, data, '充值成功')
  } catch (err) {
    next(err)
  }
})
