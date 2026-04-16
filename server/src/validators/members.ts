import { z } from 'zod'

const experienceLevels = ['beginner', 'elementary', 'intermediate', 'senior'] as const

/** 添加会员到群组 */
export const addMemberSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(20),
  nickname: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
  outdoorTitle: z.string().max(20).optional(),
  hasCar: z.boolean().optional(),
  hasLicense: z.boolean().optional(),
  experienceLevel: z.enum(experienceLevels).optional(),
  notes: z.string().max(500).optional(),
})

/** 更新会员信息 */
export const updateMemberSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  nickname: z.string().max(20).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  outdoorTitle: z.string().max(20).nullable().optional(),
  hasCar: z.boolean().optional(),
  hasLicense: z.boolean().optional(),
  experienceLevel: z.enum(experienceLevels).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
