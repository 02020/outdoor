import { db } from '../db/connection'
import { routes } from '../db/schema/index'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../middleware/errorHandler'
import type { CreateRouteInput, UpdateRouteInput } from '../validators/routes'

export function listRoutes(groupId: number) {
  return db.select().from(routes)
    .where(eq(routes.groupId, groupId))
    .all()
}

export function getRoute(groupId: number, routeId: number) {
  const row = db.select().from(routes)
    .where(and(eq(routes.id, routeId), eq(routes.groupId, groupId)))
    .get()
  if (!row) throw new AppError(404, '路线不存在')
  return row
}

export function createRoute(groupId: number, input: CreateRouteInput) {
  return db.insert(routes).values({
    groupId,
    name: input.name,
    description: input.description ?? null,
    regionCode: input.regionCode ?? null,
    difficulty: input.difficulty ?? null,
    routeType: input.routeType ?? null,
    altitudeM: input.altitudeM ?? null,
    elevationGainM: input.elevationGainM ?? null,
    distanceKm: input.distanceKm ?? null,
    driveDistanceKm: input.driveDistanceKm ?? null,
    driveTimeMin: input.driveTimeMin ?? null,
    estimatedTimeMin: input.estimatedTimeMin ?? null,
    bestSeason: input.bestSeason ?? null,
    hasWaterSource: input.hasWaterSource ?? null,
    hasCellSignal: input.hasCellSignal ?? null,
    parkingInfo: input.parkingInfo ?? null,
    sceneryTags: input.sceneryTags ? JSON.stringify(input.sceneryTags) : null,
    trackRef: input.trackRef ?? null,
    notes: input.notes ?? null,
    waypointsJson: input.waypoints ? JSON.stringify(input.waypoints) : null,
    createdAt: Date.now(),
  }).returning().get()
}

export function updateRoute(groupId: number, routeId: number, input: UpdateRouteInput) {
  getRoute(groupId, routeId)

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.regionCode !== undefined) updates.regionCode = input.regionCode
  if (input.difficulty !== undefined) updates.difficulty = input.difficulty
  if (input.routeType !== undefined) updates.routeType = input.routeType
  if (input.altitudeM !== undefined) updates.altitudeM = input.altitudeM
  if (input.elevationGainM !== undefined) updates.elevationGainM = input.elevationGainM
  if (input.distanceKm !== undefined) updates.distanceKm = input.distanceKm
  if (input.driveDistanceKm !== undefined) updates.driveDistanceKm = input.driveDistanceKm
  if (input.driveTimeMin !== undefined) updates.driveTimeMin = input.driveTimeMin
  if (input.estimatedTimeMin !== undefined) updates.estimatedTimeMin = input.estimatedTimeMin
  if (input.bestSeason !== undefined) updates.bestSeason = input.bestSeason
  if (input.hasWaterSource !== undefined) updates.hasWaterSource = input.hasWaterSource
  if (input.hasCellSignal !== undefined) updates.hasCellSignal = input.hasCellSignal
  if (input.parkingInfo !== undefined) updates.parkingInfo = input.parkingInfo
  if (input.sceneryTags !== undefined) updates.sceneryTags = input.sceneryTags ? JSON.stringify(input.sceneryTags) : null
  if (input.trackRef !== undefined) updates.trackRef = input.trackRef
  if (input.notes !== undefined) updates.notes = input.notes
  if (input.waypoints !== undefined) updates.waypointsJson = input.waypoints ? JSON.stringify(input.waypoints) : null

  if (Object.keys(updates).length > 0) {
    db.update(routes).set(updates).where(eq(routes.id, routeId)).run()
  }
  return getRoute(groupId, routeId)
}

export function deleteRoute(groupId: number, routeId: number) {
  getRoute(groupId, routeId)
  db.delete(routes).where(eq(routes.id, routeId)).run()
}
