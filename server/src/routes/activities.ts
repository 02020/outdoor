import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createActivitySchema,
  updateActivitySchema,
  setActivityMembersSchema,
  addExpenseSchema,
} from '../validators/activities'
import * as actService from '../services/activities'
import { ok } from '../utils/response'

export const activityRouter = Router()

activityRouter.use(authGuard)

// ─── 活动 CRUD ───

/** GET /api/activities - 活动列表 */
activityRouter.get('/', (req, res) => {
  const data = actService.listActivities(req.auth!.groupId)
  ok(res, data)
})

/** GET /api/activities/:id - 活动完整详情 */
activityRouter.get('/:id', (req, res, next) => {
  try {
    const data = actService.getActivityDetail(req.auth!.groupId, Number(req.params.id))
    ok(res, data)
  } catch (err) { next(err) }
})

/** POST /api/activities - 创建活动 (管理员) */
activityRouter.post('/', adminOnly, validate(createActivitySchema), (req, res, next) => {
  try {
    const data = actService.createActivity(req.auth!.groupId, req.body)
    ok(res, data, '活动创建成功')
  } catch (err) { next(err) }
})

/** PUT /api/activities/:id - 更新活动 (管理员) */
activityRouter.put('/:id', adminOnly, validate(updateActivitySchema), (req, res, next) => {
  try {
    const data = actService.updateActivity(req.auth!.groupId, Number(req.params.id), req.body)
    ok(res, data, '活动已更新')
  } catch (err) { next(err) }
})

/** DELETE /api/activities/:id - 删除活动 (管理员) */
activityRouter.delete('/:id', adminOnly, (req, res, next) => {
  try {
    actService.deleteActivity(req.auth!.groupId, Number(req.params.id))
    ok(res, null, '活动已删除')
  } catch (err) { next(err) }
})

// ─── 参与人管理 ───

/** PUT /api/activities/:id/members - 设置参与人 (管理员) */
activityRouter.put('/:id/members', adminOnly, validate(setActivityMembersSchema), (req, res, next) => {
  try {
    const data = actService.setActivityMembers(req.auth!.groupId, Number(req.params.id), req.body.members)
    ok(res, data, '参与人已更新')
  } catch (err) { next(err) }
})

// ─── 费用管理 ───

/** POST /api/activities/:id/expenses - 添加费用 (管理员) */
activityRouter.post('/:id/expenses', adminOnly, validate(addExpenseSchema), (req, res, next) => {
  try {
    const data = actService.addExpense(req.auth!.groupId, Number(req.params.id), req.body)
    ok(res, data, '费用已添加')
  } catch (err) { next(err) }
})

/** DELETE /api/activities/:id/expenses/:eid - 删除费用 (管理员) */
activityRouter.delete('/:id/expenses/:eid', adminOnly, (req, res, next) => {
  try {
    actService.deleteExpense(req.auth!.groupId, Number(req.params.id), Number(req.params.eid))
    ok(res, null, '费用已删除')
  } catch (err) { next(err) }
})

// ─── 结算 ───

/** GET /api/activities/:id/settlement/preview - 结算预览 */
activityRouter.get('/:id/settlement/preview', (req, res, next) => {
  try {
    const data = actService.previewSettlement(req.auth!.groupId, Number(req.params.id))
    ok(res, data)
  } catch (err) { next(err) }
})

/** POST /api/activities/:id/settlement/confirm - 确认结算 (管理员) */
activityRouter.post('/:id/settlement/confirm', adminOnly, (req, res, next) => {
  try {
    const data = actService.confirmSettlement(req.auth!.groupId, Number(req.params.id))
    ok(res, data, '结算完成')
  } catch (err) { next(err) }
})

/** POST /api/activities/:id/settlement/reverse - 结算冲红 (管理员) */
activityRouter.post('/:id/settlement/reverse', adminOnly, (req, res, next) => {
  try {
    const data = actService.reverseSettlement(req.auth!.groupId, Number(req.params.id))
    ok(res, data, '结算已冲红')
  } catch (err) { next(err) }
})
