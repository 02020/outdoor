import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createRouteSchema, updateRouteSchema } from '../validators/routes'
import * as routeService from '../services/routes'
import { ok } from '../utils/response'

export const routeRouter = Router()

routeRouter.use(authGuard)

/** GET /api/routes - 路线列表 */
routeRouter.get('/', (req, res, next) => {
  try {
    const data = routeService.listRoutes(req.auth!.groupId)
    ok(res, data)
  } catch (err) { next(err) }
})

/** GET /api/routes/:id - 路线详情 */
routeRouter.get('/:id', (req, res, next) => {
  try {
    const data = routeService.getRoute(req.auth!.groupId, Number(req.params.id))
    ok(res, data)
  } catch (err) { next(err) }
})

/** POST /api/routes - 创建路线 (管理员) */
routeRouter.post('/', adminOnly, validate(createRouteSchema), (req, res, next) => {
  try {
    const data = routeService.createRoute(req.auth!.groupId, req.body)
    ok(res, data, '路线创建成功')
  } catch (err) { next(err) }
})

/** PUT /api/routes/:id - 更新路线 (管理员) */
routeRouter.put('/:id', adminOnly, validate(updateRouteSchema), (req, res, next) => {
  try {
    const data = routeService.updateRoute(req.auth!.groupId, Number(req.params.id), req.body)
    ok(res, data, '路线已更新')
  } catch (err) { next(err) }
})

/** DELETE /api/routes/:id - 删除路线 (管理员) */
routeRouter.delete('/:id', adminOnly, (req, res, next) => {
  try {
    routeService.deleteRoute(req.auth!.groupId, Number(req.params.id))
    ok(res, null, '路线已删除')
  } catch (err) { next(err) }
})
