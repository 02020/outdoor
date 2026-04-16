import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'
import { groups } from './groups'
import { members } from './members'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  activityId: integer('activity_id').references(() => activities.id),
  type: text('type', { enum: ['topup', 'debit', 'reversal', 'adjustment'] }).notNull(),
  amount: real('amount').notNull(),
  balanceBefore: real('balance_before').notNull(),
  balanceAfter: real('balance_after').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
