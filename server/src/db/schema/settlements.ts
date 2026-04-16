import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'
import { members } from './members'

export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  type: text('type', { enum: ['collect', 'reimburse'] }).notNull(),
  amount: real('amount').notNull(),
  mode: text('mode', { enum: ['balance', 'cash'] }).notNull(),
  status: text('status', { enum: ['pending', 'confirmed'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
