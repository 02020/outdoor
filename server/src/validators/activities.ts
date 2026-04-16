import { z } from 'zod'

/** 创建活动 */
export const createActivitySchema = z.object({
  name: z.string().min(1, '活动名称不能为空').max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式 YYYY-MM-DD'),
  location: z.string().max(100).optional(),
  routeId: z.number({ coerce: true }).int().positive().optional(),
  splitMode: z.enum(['all_split', 'per_car']).default('all_split'),
  reimburseMode: z.enum(['balance', 'cash']).default('balance'),
  notes: z.string().max(500).optional(),
})

/** 更新活动 */
export const updateActivitySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  location: z.string().max(100).nullable().optional(),
  routeId: z.number({ coerce: true }).int().positive().nullable().optional(),
  splitMode: z.enum(['all_split', 'per_car']).optional(),
  reimburseMode: z.enum(['balance', 'cash']).optional(),
  notes: z.string().max(500).nullable().optional(),
})

/** 添加活动参与人 */
export const addActivityMemberSchema = z.object({
  memberId: z.number({ coerce: true }).int().positive(),
  hangerOnCount: z.number().int().min(0).default(0),
  vehicleId: z.number({ coerce: true }).int().positive().optional(),
})

/** 批量设置参与人 */
export const setActivityMembersSchema = z.object({
  members: z.array(z.object({
    memberId: z.number({ coerce: true }).int().positive(),
    hangerOnCount: z.number().int().min(0).default(0),
    vehicleId: z.number({ coerce: true }).int().positive().optional(),
  })).min(1, '至少需要一名参与人'),
})

/** 添加费用 */
export const addExpenseSchema = z.object({
  category: z.enum(['food', 'gas', 'toll', 'parking', 'accommodation', 'other']),
  amount: z.number().positive('金额必须大于0'),
  payerId: z.number({ coerce: true }).int().positive(),
  description: z.string().max(200).optional(),
  isVehicleCost: z.boolean().default(false),
  vehicleId: z.number({ coerce: true }).int().positive().optional(),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type AddActivityMemberInput = z.infer<typeof addActivityMemberSchema>
export type SetActivityMembersInput = z.infer<typeof setActivityMembersSchema>
export type AddExpenseInput = z.infer<typeof addExpenseSchema>
