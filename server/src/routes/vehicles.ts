import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicles'
import * as vehicleService from '../services/vehicles'
import { ok } from '../utils/response'

export const vehicleRouter = Router()

vehicleRouter.use(authGuard)

/** GET /api/vehicles - 车辆列表 */
vehicleRouter.get('/', (req, res, next) => {
  try {
    const data = vehicleService.listVehicles(req.auth!.groupId)
    ok(res, data)
  } catch (err) { next(err) }
})

/** GET /api/vehicles/:id - 车辆详情 */
vehicleRouter.get('/:id', (req, res, next) => {
  try {
    const data = vehicleService.getVehicle(req.auth!.groupId, Number(req.params.id))
    ok(res, data)
  } catch (err) { next(err) }
})

/** POST /api/vehicles - 创建车辆 (管理员) */
vehicleRouter.post('/', adminOnly, validate(createVehicleSchema), (req, res, next) => {
  try {
    const data = vehicleService.createVehicle(req.auth!.groupId, req.body)
    ok(res, data, '车辆添加成功')
  } catch (err) { next(err) }
})

/** PUT /api/vehicles/:id - 更新车辆 (管理员) */
vehicleRouter.put('/:id', adminOnly, validate(updateVehicleSchema), (req, res, next) => {
  try {
    const data = vehicleService.updateVehicle(req.auth!.groupId, Number(req.params.id), req.body)
    ok(res, data, '车辆已更新')
  } catch (err) { next(err) }
})

/** DELETE /api/vehicles/:id - 删除车辆 (管理员) */
vehicleRouter.delete('/:id', adminOnly, (req, res, next) => {
  try {
    vehicleService.deleteVehicle(req.auth!.groupId, Number(req.params.id))
    ok(res, null, '车辆已删除')
  } catch (err) { next(err) }
})
