import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { groups } from './groups'
import { members } from './members'

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  plateNumber: text('plate_number').notNull(),
  model: text('model'),
  ownerId: integer('owner_id').references(() => members.id),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
