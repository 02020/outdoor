import { db } from '../db/connection'
import { vehicles, members } from '../db/schema/index'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../middleware/errorHandler'
import type { CreateVehicleInput, UpdateVehicleInput } from '../validators/vehicles'

export function listVehicles(groupId: number) {
  return db
    .select({
      id: vehicles.id,
      groupId: vehicles.groupId,
      plateNumber: vehicles.plateNumber,
      model: vehicles.model,
      ownerId: vehicles.ownerId,
      ownerName: members.name,
      createdAt: vehicles.createdAt,
    })
    .from(vehicles)
    .leftJoin(members, eq(vehicles.ownerId, members.id))
    .where(eq(vehicles.groupId, groupId))
    .all()
}

export function getVehicle(groupId: number, vehicleId: number) {
  const row = db.select().from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.groupId, groupId)))
    .get()
  if (!row) throw new AppError(404, '车辆不存在')
  return row
}

export function createVehicle(groupId: number, input: CreateVehicleInput) {
  return db.insert(vehicles).values({
    groupId,
    plateNumber: input.plateNumber,
    model: input.model ?? null,
    ownerId: input.ownerId ?? null,
    createdAt: Date.now(),
  }).returning().get()
}

export function updateVehicle(groupId: number, vehicleId: number, input: UpdateVehicleInput) {
  getVehicle(groupId, vehicleId)

  const updates: Record<string, unknown> = {}
  if (input.plateNumber !== undefined) updates.plateNumber = input.plateNumber
  if (input.model !== undefined) updates.model = input.model
  if (input.ownerId !== undefined) updates.ownerId = input.ownerId

  if (Object.keys(updates).length > 0) {
    db.update(vehicles).set(updates).where(eq(vehicles.id, vehicleId)).run()
  }
  return getVehicle(groupId, vehicleId)
}

export function deleteVehicle(groupId: number, vehicleId: number) {
  getVehicle(groupId, vehicleId)
  db.delete(vehicles).where(eq(vehicles.id, vehicleId)).run()
}
