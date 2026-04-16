import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { groups } from './groups'
import { members } from './members'

export const groupMembers = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  balance: real('balance').notNull().default(0),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'number' }).notNull(),
}, (table) => [
  uniqueIndex('idx_group_member').on(table.groupId, table.memberId),
])
