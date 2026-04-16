import { integer, real, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'
import { members } from './members'
import { vehicles } from './vehicles'

export const activityMembers = sqliteTable('activity_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  memberId: integer('member_id').notNull().references(() => members.id),
  hangerOnCount: integer('hanger_on_count').notNull().default(0),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  amountCharged: real('amount_charged').default(0),
  amountAdvanced: real('amount_advanced').default(0),
  netAmount: real('net_amount').default(0),
  isAbsent: integer('is_absent', { mode: 'boolean' }).default(false),
}, (table) => [
  uniqueIndex('idx_activity_member').on(table.activityId, table.memberId),
])
