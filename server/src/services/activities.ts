import { db, sqlite } from '../db/connection'
import {
  activities, activityMembers, expenses, members,
  groupMembers, transactions, settlements,
} from '../db/schema/index'
import { eq, and, desc } from 'drizzle-orm'
import { AppError } from '../middleware/errorHandler'
import { calculateSettlement } from '@outdoor-fund/shared'
import type { CreateActivityInput, UpdateActivityInput, AddExpenseInput } from '../validators/activities'
import type { SettlementParticipant, SettlementExpense } from '@outdoor-fund/shared'
import { writeAuditLog } from './audit'

// ─── 活动 CRUD ───

export function listActivities(groupId: number) {
  return db.select().from(activities)
    .where(eq(activities.groupId, groupId))
    .orderBy(desc(activities.date))
    .all()
}

export function getActivity(groupId: number, activityId: number) {
  const row = db.select().from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.groupId, groupId)))
    .get()
  if (!row) throw new AppError(404, '活动不存在')
  return row
}

export function createActivity(groupId: number, input: CreateActivityInput) {
  const now = Date.now()
  return db.insert(activities).values({
    groupId,
    name: input.name,
    date: input.date,
    location: input.location ?? null,
    routeId: input.routeId ?? null,
    splitMode: input.splitMode,
    reimburseMode: input.reimburseMode,
    status: 'draft',
    notes: input.notes ?? null,
    createdAt: now,
  }).returning().get()
}

export function updateActivity(groupId: number, activityId: number, input: UpdateActivityInput) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '只能编辑草稿状态的活动')
  }

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.date !== undefined) updates.date = input.date
  if (input.location !== undefined) updates.location = input.location
  if (input.routeId !== undefined) updates.routeId = input.routeId
  if (input.splitMode !== undefined) updates.splitMode = input.splitMode
  if (input.reimburseMode !== undefined) updates.reimburseMode = input.reimburseMode
  if (input.notes !== undefined) updates.notes = input.notes

  if (Object.keys(updates).length > 0) {
    db.update(activities).set(updates).where(eq(activities.id, activityId)).run()
  }
  return getActivity(groupId, activityId)
}

export function deleteActivity(groupId: number, activityId: number) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '只能删除草稿状态的活动')
  }
  db.delete(expenses).where(eq(expenses.activityId, activityId)).run()
  db.delete(activityMembers).where(eq(activityMembers.activityId, activityId)).run()
  db.delete(activities).where(eq(activities.id, activityId)).run()
}

// ─── 参与人管理 ───

export function getActivityMembers(activityId: number) {
  return db
    .select({
      id: activityMembers.id,
      activityId: activityMembers.activityId,
      memberId: activityMembers.memberId,
      memberName: members.name,
      memberNickname: members.nickname,
      hangerOnCount: activityMembers.hangerOnCount,
      vehicleId: activityMembers.vehicleId,
      amountCharged: activityMembers.amountCharged,
      amountAdvanced: activityMembers.amountAdvanced,
      netAmount: activityMembers.netAmount,
      isAbsent: activityMembers.isAbsent,
    })
    .from(activityMembers)
    .innerJoin(members, eq(activityMembers.memberId, members.id))
    .where(eq(activityMembers.activityId, activityId))
    .all()
}

export function setActivityMembers(
  groupId: number,
  activityId: number,
  memberList: { memberId: number; hangerOnCount: number; vehicleId?: number }[],
) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '只能编辑草稿状态的活动参与人')
  }

  sqlite.transaction(() => {
    db.delete(activityMembers).where(eq(activityMembers.activityId, activityId)).run()
    for (const m of memberList) {
      db.insert(activityMembers).values({
        activityId,
        memberId: m.memberId,
        hangerOnCount: m.hangerOnCount,
        vehicleId: m.vehicleId ?? null,
      }).run()
    }
  })()

  return getActivityMembers(activityId)
}

// ─── 费用管理 ───

export function getExpenses(activityId: number) {
  return db
    .select({
      id: expenses.id,
      activityId: expenses.activityId,
      category: expenses.category,
      amount: expenses.amount,
      payerId: expenses.payerId,
      payerName: members.name,
      description: expenses.description,
      isVehicleCost: expenses.isVehicleCost,
      vehicleId: expenses.vehicleId,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .innerJoin(members, eq(expenses.payerId, members.id))
    .where(eq(expenses.activityId, activityId))
    .all()
}

export function addExpense(groupId: number, activityId: number, input: AddExpenseInput) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '只能在草稿状态添加费用')
  }

  return db.insert(expenses).values({
    activityId,
    category: input.category,
    amount: input.amount,
    payerId: input.payerId,
    description: input.description ?? null,
    isVehicleCost: input.isVehicleCost,
    vehicleId: input.vehicleId ?? null,
    createdAt: Date.now(),
  }).returning().get()
}

export function deleteExpense(groupId: number, activityId: number, expenseId: number) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '只能在草稿状态删除费用')
  }
  db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.activityId, activityId))).run()
}

// ─── 结算预览 ───

export function previewSettlement(groupId: number, activityId: number) {
  getActivity(groupId, activityId)

  const memberRows = db.select().from(activityMembers)
    .where(eq(activityMembers.activityId, activityId)).all()
  const expenseRows = db.select().from(expenses)
    .where(eq(expenses.activityId, activityId)).all()

  const participants: SettlementParticipant[] = memberRows.map((m) => ({
    memberId: m.memberId,
    hangerOnCount: m.hangerOnCount,
    vehicleId: m.vehicleId ?? undefined,
    isAbsent: m.isAbsent ?? false,
  }))

  const expenseList: SettlementExpense[] = expenseRows.map((e) => ({
    category: e.category,
    amount: e.amount,
    payerId: e.payerId,
    isVehicleCost: e.isVehicleCost ?? false,
    vehicleId: e.vehicleId ?? undefined,
  }))

  const act = getActivity(groupId, activityId)
  return calculateSettlement({ participants, expenses: expenseList, splitMode: act.splitMode as any })
}

// ─── 确认结算（原子事务） ───

export function confirmSettlement(groupId: number, activityId: number) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'draft') {
    throw new AppError(400, '该活动不是草稿状态，无法结算')
  }

  const result = previewSettlement(groupId, activityId)

  if (result.participants.length === 0) {
    throw new AppError(400, '没有参与人，无法结算')
  }

  const now = Date.now()

  sqlite.transaction(() => {
    // 1. 更新活动参与人的结算数据
    for (const pr of result.participants) {
      db.update(activityMembers).set({
        amountCharged: pr.amountCharged,
        amountAdvanced: pr.amountAdvanced,
        netAmount: pr.netAmount,
      }).where(
        and(eq(activityMembers.activityId, activityId), eq(activityMembers.memberId, pr.memberId)),
      ).run()
    }

    // 2. 如果是走公款模式，扣减/增加会员余额 + 写流水
    if (act.reimburseMode === 'balance') {
      for (const pr of result.participants) {
        const gm = db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, pr.memberId)))
          .get()
        if (!gm) continue

        const balanceBefore = gm.balance
        // netAmount > 0 表示应付（扣款）, < 0 表示应收（退款）
        const balanceAfter = Math.round((balanceBefore - pr.netAmount) * 100) / 100

        db.update(groupMembers).set({ balance: balanceAfter })
          .where(eq(groupMembers.id, gm.id)).run()

        db.insert(transactions).values({
          groupId,
          memberId: pr.memberId,
          activityId,
          type: 'debit',
          amount: -pr.netAmount,
          balanceBefore,
          balanceAfter,
          description: `活动结算: ${act.name}`,
          createdAt: now,
        }).run()
      }
    }

    // 3. 写 settlements 转账记录（收款 + 报销）
    for (const t of result.transfers) {
      db.insert(settlements).values({
        activityId,
        memberId: t.memberId,
        type: t.type,
        amount: t.amount,
        mode: act.reimburseMode,
        status: 'pending',
        createdAt: now,
      }).run()
    }

    // 4. 更新活动状态
    db.update(activities).set({
      status: 'settled',
      totalCost: result.totalCost,
      unitPrice: result.sharedPerHead,
      settledAt: now,
    }).where(eq(activities.id, activityId)).run()
  })()

  writeAuditLog({ groupId, entityType: 'Activity', entityId: activityId, action: 'settle', diffJson: JSON.stringify({ totalCost: result.totalCost, participants: result.participants.length }) })

  return { ...result, status: 'settled' }
}

// ─── 结算冲红（原子事务） ───

export function reverseSettlement(groupId: number, activityId: number) {
  const act = getActivity(groupId, activityId)
  if (act.status !== 'settled') {
    throw new AppError(400, '只有已结算的活动才能冲红')
  }

  const now = Date.now()

  sqlite.transaction(() => {
    // 1. 如果是走公款模式，反转余额变动 + 写反向流水
    if (act.reimburseMode === 'balance') {
      const memberRows = db.select().from(activityMembers)
        .where(eq(activityMembers.activityId, activityId)).all()

      for (const am of memberRows) {
        const gm = db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, am.memberId)))
          .get()
        if (!gm) continue

        const netAmount = am.netAmount ?? 0
        const balanceBefore = gm.balance
        // 冲红 = 反转之前的扣减: netAmount > 0 之前被扣款，现在加回来
        const balanceAfter = Math.round((balanceBefore + netAmount) * 100) / 100

        db.update(groupMembers).set({ balance: balanceAfter })
          .where(eq(groupMembers.id, gm.id)).run()

        db.insert(transactions).values({
          groupId,
          memberId: am.memberId,
          activityId,
          type: 'reversal',
          amount: netAmount,
          balanceBefore,
          balanceAfter,
          description: `结算冲红: ${act.name}`,
          createdAt: now,
        }).run()
      }
    }

    // 2. 重置参与人的结算数据
    db.update(activityMembers).set({
      amountCharged: 0,
      amountAdvanced: 0,
      netAmount: 0,
    }).where(eq(activityMembers.activityId, activityId)).run()

    // 3. 删除 settlements 转账记录
    db.delete(settlements).where(eq(settlements.activityId, activityId)).run()

    // 4. 更新活动状态为 reversed
    db.update(activities).set({
      status: 'reversed',
      settledAt: null,
    }).where(eq(activities.id, activityId)).run()
  })()

  writeAuditLog({ groupId, entityType: 'Activity', entityId: activityId, action: 'reverse', diffJson: JSON.stringify({ name: act.name }) })

  return getActivity(groupId, activityId)
}

// ─── 获取活动完整详情 ───

export function getActivityDetail(groupId: number, activityId: number) {
  const activity = getActivity(groupId, activityId)
  const memberList = getActivityMembers(activityId)
  const expenseList = getExpenses(activityId)
  const settlementList = db.select().from(settlements)
    .where(eq(settlements.activityId, activityId)).all()

  return { activity, members: memberList, expenses: expenseList, settlements: settlementList }
}
