import { z } from 'zod'

/** 创建路线 */
export const createRouteSchema = z.object({
  name: z.string().min(1, '路线名称不能为空').max(100),
  description: z.string().max(500).optional(),
  regionCode: z.string().max(12).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  routeType: z.string().max(20).optional(),
  altitudeM: z.number().positive().optional(),
  elevationGainM: z.number().positive().optional(),
  distanceKm: z.number().positive().optional(),
  driveDistanceKm: z.number().positive().optional(),
  driveTimeMin: z.number().int().positive().optional(),
  estimatedTimeMin: z.number().int().positive().optional(),
  bestSeason: z.string().max(50).optional(),
  hasWaterSource: z.boolean().optional(),
  hasCellSignal: z.boolean().optional(),
  parkingInfo: z.string().max(200).optional(),
  sceneryTags: z.array(z.string()).optional(),
  trackRef: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  waypoints: z.array(z.object({
    name: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })).optional(),
})

/** 更新路线 */
export const updateRouteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  regionCode: z.string().max(12).nullable().optional(),
  difficulty: z.number().int().min(1).max(5).nullable().optional(),
  routeType: z.string().max(20).nullable().optional(),
  altitudeM: z.number().positive().nullable().optional(),
  elevationGainM: z.number().positive().nullable().optional(),
  distanceKm: z.number().positive().nullable().optional(),
  driveDistanceKm: z.number().positive().nullable().optional(),
  driveTimeMin: z.number().int().positive().nullable().optional(),
  estimatedTimeMin: z.number().int().positive().nullable().optional(),
  bestSeason: z.string().max(50).nullable().optional(),
  hasWaterSource: z.boolean().nullable().optional(),
  hasCellSignal: z.boolean().nullable().optional(),
  parkingInfo: z.string().max(200).nullable().optional(),
  sceneryTags: z.array(z.string()).nullable().optional(),
  trackRef: z.string().max(500).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  waypoints: z.array(z.object({
    name: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })).nullable().optional(),
})

export type CreateRouteInput = z.infer<typeof createRouteSchema>
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>
