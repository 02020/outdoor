import { z } from 'zod'

/** 充值 */
export const topupSchema = z.object({
  memberId: z.number({ coerce: true }).int().positive(),
  amount: z.number().positive('充值金额必须大于0'),
  description: z.string().max(200).optional(),
})

export type TopupInput = z.infer<typeof topupSchema>
