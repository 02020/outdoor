import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { groups } from './groups'
import { members } from './members'

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  action: text('action').notNull(),
  diffJson: text('diff_json'),
  operatorId: integer('operator_id').references(() => members.id),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
