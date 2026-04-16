import { db } from '../db/connection'
import { groups } from '../db/schema/index'
import { eq } from 'drizzle-orm'
import { hashPassword, comparePassword } from '../utils/crypto'
import { signToken } from '../utils/token'
import { AppError } from '../middleware/errorHandler'
import type { CreateGroupInput, LoginInput } from '../validators/auth'
import type { GroupRole } from '@outdoor-fund/shared'

export async function createGroup(input: CreateGroupInput) {
  const existing = db.select().from(groups).where(eq(groups.name, input.name)).get()
  if (existing) {
    throw new AppError(409, '群组名称已存在')
  }

  const adminHash = await hashPassword(input.adminPassword)
  const memberHash = await hashPassword(input.memberPassword)
  const now = Date.now()

  const result = db.insert(groups).values({
    name: input.name,
    adminPasswordHash: adminHash,
    memberPasswordHash: memberHash,
    description: input.description ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning().get()

  return {
    id: result.id,
    name: result.name,
    description: result.description,
  }
}

export async function login(input: LoginInput) {
  const group = db.select().from(groups).where(eq(groups.id, input.groupId)).get()
  if (!group) {
    throw new AppError(404, '群组不存在')
  }

  // 依次尝试管理员密码和会员密码
  let role: GroupRole

  if (await comparePassword(input.password, group.adminPasswordHash)) {
    role = 'admin'
  } else if (await comparePassword(input.password, group.memberPasswordHash)) {
    role = 'member'
  } else {
    throw new AppError(401, '密码错误')
  }

  const token = signToken({ groupId: group.id, role })

  return {
    token,
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
    },
    role,
  }
}

export function listGroups() {
  return db.select({
    id: groups.id,
    name: groups.name,
    description: groups.description,
    createdAt: groups.createdAt,
  }).from(groups).all()
}
