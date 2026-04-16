import { z } from 'zod'

/** 创建车辆 */
export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, '车牌号不能为空').max(20),
  model: z.string().max(50).optional(),
  ownerId: z.number({ coerce: true }).int().positive().optional(),
})

/** 更新车辆 */
export const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1).max(20).optional(),
  model: z.string().max(50).nullable().optional(),
  ownerId: z.number({ coerce: true }).int().positive().nullable().optional(),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
