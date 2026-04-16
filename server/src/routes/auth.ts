import { Router } from 'express'
import { validate } from '../middleware/validate'
import { createGroupSchema, loginSchema } from '../validators/auth'
import * as authService from '../services/auth'
import { ok } from '../utils/response'

export const authRouter = Router()

/** POST /api/auth/groups - 创建群组 */
authRouter.post('/groups', validate(createGroupSchema), async (req, res, next) => {
  try {
    const data = await authService.createGroup(req.body)
    ok(res, data, '群组创建成功')
  } catch (err) {
    next(err)
  }
})

/** GET /api/auth/groups - 群组列表（用于登录选择） */
authRouter.get('/groups', (_req, res) => {
  const data = authService.listGroups()
  ok(res, data)
})

/** POST /api/auth/login - 登录（双密码判断角色） */
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const data = await authService.login(req.body)
    ok(res, data, '登录成功')
  } catch (err) {
    next(err)
  }
})
