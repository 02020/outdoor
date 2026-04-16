import { db } from '../db/connection'
import { groups } from '../db/schema/index'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../utils/crypto'
import { AppError } from '../middleware/errorHandler'

export function getGroup(groupId: number) {
  const group = db.select({
    id: groups.id,
    name: groups.name,
    description: groups.description,
    createdAt: groups.createdAt,
    updatedAt: groups.updatedAt,
  }).from(groups).where(eq(groups.id, groupId)).get()

  if (!group) {
    throw new AppError(404, '群组不存在')
  }
  return group
}

export async function updateGroup(
  groupId: number,
  input: { name?: string; description?: string; adminPassword?: string; memberPassword?: string },
) {
  const existing = db.select().from(groups).where(eq(groups.id, groupId)).get()
  if (!existing) throw new AppError(404, '群组不存在')

  const updates: Record<string, unknown> = { updatedAt: Date.now() }

  if (input.name !== undefined) {
    updates.name = input.name
  }
  if (input.description !== undefined) {
    updates.description = input.description
  }
  if (input.adminPassword) {
    updates.adminPasswordHash = await hashPassword(input.adminPassword)
  }
  if (input.memberPassword) {
    updates.memberPasswordHash = await hashPassword(input.memberPassword)
  }

  db.update(groups).set(updates).where(eq(groups.id, groupId)).run()

  return getGroup(groupId)
}
