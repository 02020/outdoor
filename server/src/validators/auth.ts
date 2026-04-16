import { z } from 'zod'

/** 创建群组 */
export const createGroupSchema = z.object({
  name: z.string().min(1, '群组名称不能为空').max(50),
  adminPassword: z.string().min(4, '管理员密码至少4位'),
  memberPassword: z.string().min(4, '会员密码至少4位'),
  description: z.string().max(200).optional(),
})

/** 登录 */
export const loginSchema = z.object({
  groupId: z.number({ coerce: true }).int().positive(),
  password: z.string().min(1, '密码不能为空'),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type LoginInput = z.infer<typeof loginSchema>
