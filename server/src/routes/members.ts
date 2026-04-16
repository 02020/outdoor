import { Router } from 'express'
import { authGuard, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { addMemberSchema, updateMemberSchema } from '../validators/members'
import * as memberService from '../services/members'
import { ok } from '../utils/response'

export const memberRouter = Router()

// 所有路由需要登录
memberRouter.use(authGuard)

/** GET /api/members - 会员列表 */
memberRouter.get('/', (req, res) => {
  const data = memberService.listMembers(req.auth!.groupId)
  ok(res, data)
})

/** GET /api/members/:id - 会员详情 */
memberRouter.get('/:id', (req, res, next) => {
  try {
    const data = memberService.getMember(req.auth!.groupId, Number(req.params.id))
    ok(res, data)
  } catch (err) {
    next(err)
  }
})

/** POST /api/members - 添加会员（仅管理员） */
memberRouter.post('/', adminOnly, validate(addMemberSchema), (req, res, next) => {
  try {
    const data = memberService.addMember(req.auth!.groupId, req.body)
    ok(res, data, '会员添加成功')
  } catch (err) {
    next(err)
  }
})

/** PUT /api/members/:id - 更新会员（仅管理员） */
memberRouter.put('/:id', adminOnly, validate(updateMemberSchema), (req, res, next) => {
  try {
    const data = memberService.updateMember(req.auth!.groupId, Number(req.params.id), req.body)
    ok(res, data, '会员信息已更新')
  } catch (err) {
    next(err)
  }
})

/** DELETE /api/members/:id - 移除会员（仅管理员） */
memberRouter.delete('/:id', adminOnly, (req, res, next) => {
  try {
    memberService.removeMember(req.auth!.groupId, Number(req.params.id))
    ok(res, null, '会员已移除')
  } catch (err) {
    next(err)
  }
})

/** PUT /api/members/:id/role - 更新会员角色（仅管理员） */
memberRouter.put('/:id/role', adminOnly, (req, res, next) => {
  try {
    const { role } = req.body
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ code: 1, data: null, message: '角色只能是 admin 或 member' })
    }
    const data = memberService.updateMemberRole(req.auth!.groupId, Number(req.params.id), role)
    ok(res, data, '角色已更新')
  } catch (err) {
    next(err)
  }
})
