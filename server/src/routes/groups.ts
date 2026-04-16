import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import * as groupService from '../services/groups'
import { ok } from '../utils/response'

export const groupRouter = Router()

// 所有群组路由都需要登录
groupRouter.use(authGuard)

/** GET /api/groups/current - 获取当前群组信息 */
groupRouter.get('/current', (req, res) => {
  const data = groupService.getGroup(req.auth!.groupId)
  ok(res, data)
})

/** PUT /api/groups/current - 更新当前群组（仅管理员） */
groupRouter.put('/current', adminOnly, async (req, res, next) => {
  try {
    const data = await groupService.updateGroup(req.auth!.groupId, req.body)
    ok(res, data, '群组信息已更新')
  } catch (err) {
    next(err)
  }
})
