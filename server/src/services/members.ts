import { db } from '../db/connection'
import { members, groupMembers, activityMembers } from '../db/schema/index'
import { eq, and, count } from 'drizzle-orm'
import { AppError } from '../middleware/errorHandler'
import type { AddMemberInput, UpdateMemberInput } from '../validators/members'
import type { MemberListItem } from '@outdoor-fund/shared'
import { writeAuditLog } from './audit'

/** 获取群组会员列表（含余额和活动次数） */
export function listMembers(groupId: number): MemberListItem[] {
  const rows = db
    .select({
      memberId: members.id,
      name: members.name,
      nickname: members.nickname,
      avatarUrl: members.avatarUrl,
      balance: groupMembers.balance,
      role: groupMembers.role,
      outdoorTitle: members.outdoorTitle,
      hasCar: members.hasCar,
      experienceLevel: members.experienceLevel,
      activityCount: count(activityMembers.id),
    })
    .from(groupMembers)
    .innerJoin(members, eq(groupMembers.memberId, members.id))
    .leftJoin(activityMembers, eq(members.id, activityMembers.memberId))
    .where(eq(groupMembers.groupId, groupId))
    .groupBy(members.id)
    .all()

  return rows as MemberListItem[]
}

/** 获取单个会员详情 */
export function getMember(groupId: number, memberId: number) {
  const row = db
    .select({
      memberId: members.id,
      name: members.name,
      nickname: members.nickname,
      avatarUrl: members.avatarUrl,
      phone: members.phone,
      outdoorTitle: members.outdoorTitle,
      hasCar: members.hasCar,
      hasLicense: members.hasLicense,
      experienceLevel: members.experienceLevel,
      notes: members.notes,
      balance: groupMembers.balance,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(members, eq(groupMembers.memberId, members.id))
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId)))
    .get()

  if (!row) throw new AppError(404, '会员不存在')
  return row
}

/** 添加会员到群组 */
export function addMember(groupId: number, input: AddMemberInput) {
  const now = Date.now()

  // 先查找是否存在同名会员（全局 members 表）
  let member = db.select().from(members).where(eq(members.name, input.name)).get()

  if (!member) {
    member = db.insert(members).values({
      name: input.name,
      nickname: input.nickname ?? null,
      phone: input.phone ?? null,
      avatarUrl: input.avatarUrl ?? null,
      outdoorTitle: input.outdoorTitle ?? null,
      hasCar: input.hasCar ?? false,
      hasLicense: input.hasLicense ?? false,
      experienceLevel: input.experienceLevel ?? null,
      notes: input.notes ?? null,
      createdAt: now,
    }).returning().get()
  }

  // 检查是否已在群组中
  const existing = db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, member.id)))
    .get()
  if (existing) {
    throw new AppError(409, '该会员已在群组中')
  }

  db.insert(groupMembers).values({
    groupId,
    memberId: member.id,
    balance: 0,
    role: 'member',
    joinedAt: now,
  }).run()

  return getMember(groupId, member.id)
}

/** 更新会员信息 */
export function updateMember(groupId: number, memberId: number, input: UpdateMemberInput) {
  getMember(groupId, memberId)

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.nickname !== undefined) updates.nickname = input.nickname
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl
  if (input.outdoorTitle !== undefined) updates.outdoorTitle = input.outdoorTitle
  if (input.hasCar !== undefined) updates.hasCar = input.hasCar
  if (input.hasLicense !== undefined) updates.hasLicense = input.hasLicense
  if (input.experienceLevel !== undefined) updates.experienceLevel = input.experienceLevel
  if (input.notes !== undefined) updates.notes = input.notes

  if (Object.keys(updates).length > 0) {
    db.update(members).set(updates).where(eq(members.id, memberId)).run()
  }

  return getMember(groupId, memberId)
}

/** 从群组移除会员 */
export function removeMember(groupId: number, memberId: number) {
  const gm = db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId)))
    .get()

  if (!gm) throw new AppError(404, '会员不存在')

  if (gm.balance !== 0) {
    throw new AppError(400, `会员余额为 ${gm.balance}，请先清零后再移除`)
  }

  db.delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId)))
    .run()

  writeAuditLog({ groupId, entityType: 'Member', entityId: memberId, action: 'remove' })
}

/** 更新会员角色 */
export function updateMemberRole(groupId: number, memberId: number, role: 'admin' | 'member') {
  const gm = db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, memberId)))
    .get()

  if (!gm) throw new AppError(404, '会员不存在')

  const oldRole = gm.role
  db.update(groupMembers).set({ role })
    .where(eq(groupMembers.id, gm.id)).run()

  writeAuditLog({ groupId, entityType: 'Member', entityId: memberId, action: 'update', diffJson: JSON.stringify({ role: { from: oldRole, to: role } }) })

  return getMember(groupId, memberId)
}
