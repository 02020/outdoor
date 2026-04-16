import { db } from '../db/connection'
import { activities, expenses, groupMembers, members, transactions } from '../db/schema/index'
import { eq, and, sum, count, desc } from 'drizzle-orm'

/** 群组统计概览 */
export function getStats(groupId: number) {
  // 1. 会员数量 & 总余额
  const memberRows = db
    .select({
      memberId: members.id,
      name: members.name,
      nickname: members.nickname,
      balance: groupMembers.balance,
    })
    .from(groupMembers)
    .innerJoin(members, eq(groupMembers.memberId, members.id))
    .where(eq(groupMembers.groupId, groupId))
    .all()

  const memberCount = memberRows.length
  const totalBalance = memberRows.reduce((s, r) => s + r.balance, 0)

  // 2. 余额排行（降序）
  const balanceRanking = [...memberRows]
    .sort((a, b) => b.balance - a.balance)
    .map((r) => ({
      memberId: r.memberId,
      name: r.name,
      nickname: r.nickname,
      balance: Math.round(r.balance * 100) / 100,
    }))

  // 3. 活动统计
  const allActivities = db.select().from(activities)
    .where(eq(activities.groupId, groupId))
    .orderBy(desc(activities.date))
    .all()

  const totalActivities = allActivities.length
  const settledActivities = allActivities.filter((a) => a.status === 'settled')
  const totalSpent = settledActivities.reduce((s, a) => s + (a.totalCost ?? 0), 0)

  // 4. 最近活动（最近 5 条已结算的）
  const recentActivities = settledActivities.slice(0, 5).map((a) => ({
    id: a.id,
    name: a.name,
    date: a.date,
    totalCost: a.totalCost,
    unitPrice: a.unitPrice,
  }))

  // 5. 费用分类统计 — 只统计已结算活动的费用
  const settledIds = settledActivities.map((a) => a.id)
  let categoryStats: { category: string; total: number }[] = []
  if (settledIds.length > 0) {
    // SQLite 不支持 IN with drizzle 直接使用，用 raw 查询
    const allExpenses = db.select().from(expenses).all()
    const settledIdSet = new Set(settledIds)
    const categoryMap = new Map<string, number>()
    for (const e of allExpenses) {
      if (settledIdSet.has(e.activityId)) {
        categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount)
      }
    }
    categoryStats = [...categoryMap.entries()]
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
  }

  // 6. 充值总额
  const topupTxs = db.select().from(transactions)
    .where(and(eq(transactions.groupId, groupId), eq(transactions.type, 'topup')))
    .all()
  const totalTopup = topupTxs.reduce((s, t) => s + t.amount, 0)

  return {
    memberCount,
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalTopup: Math.round(totalTopup * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalActivities,
    settledActivities: settledActivities.length,
    balanceRanking,
    recentActivities,
    categoryStats,
  }
}

/** 获取群组的交易流水 */
export function getTransactions(groupId: number, memberId?: number) {
  const rows = db
    .select({
      id: transactions.id,
      memberId: transactions.memberId,
      memberName: members.name,
      memberNickname: members.nickname,
      activityId: transactions.activityId,
      type: transactions.type,
      amount: transactions.amount,
      balanceBefore: transactions.balanceBefore,
      balanceAfter: transactions.balanceAfter,
      description: transactions.description,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(members, eq(transactions.memberId, members.id))
    .where(
      memberId
        ? and(eq(transactions.groupId, groupId), eq(transactions.memberId, memberId))
        : eq(transactions.groupId, groupId),
    )
    .orderBy(desc(transactions.createdAt))
    .all()

  return rows
}
