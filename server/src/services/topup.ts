import { db, sqlite } from '../db/connection'
import { groupMembers, transactions } from '../db/schema/index'
import { eq, and } from 'drizzle-orm'
import { AppError } from '../middleware/errorHandler'
import type { TopupInput } from '../validators/topup'
import { writeAuditLog } from './audit'

/** 手动充值（原子事务：更新余额 + 写流水） */
export function topup(groupId: number, input: TopupInput) {
  const run = sqlite.transaction(() => {
    // 查询当前余额
    const gm = db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberId, input.memberId)))
      .get()

    if (!gm) throw new AppError(404, '会员不存在')

    const balanceBefore = gm.balance
    const balanceAfter = Math.round((balanceBefore + input.amount) * 100) / 100
    const now = Date.now()

    // 更新余额
    db.update(groupMembers)
      .set({ balance: balanceAfter })
      .where(eq(groupMembers.id, gm.id))
      .run()

    // 写流水记录
    const tx = db.insert(transactions).values({
      groupId,
      memberId: input.memberId,
      activityId: null,
      type: 'topup',
      amount: input.amount,
      balanceBefore,
      balanceAfter,
      description: input.description ?? '手动充值',
      createdAt: now,
    }).returning().get()

    return {
      transactionId: tx.id,
      memberId: input.memberId,
      amount: input.amount,
      balanceBefore,
      balanceAfter,
    }
  })

  const result = run()

  writeAuditLog({ groupId, entityType: 'Member', entityId: input.memberId, action: 'topup', diffJson: JSON.stringify({ amount: input.amount, balanceAfter: result.balanceAfter }) })

  return result
}
