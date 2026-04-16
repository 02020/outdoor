import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'
import { members } from './members'
import { vehicles } from './vehicles'

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activityId: integer('activity_id').notNull().references(() => activities.id),
  category: text('category', {
    enum: ['food', 'gas', 'toll', 'parking', 'accommodation', 'other'],
  }).notNull(),
  amount: real('amount').notNull(),
  payerId: integer('payer_id').notNull().references(() => members.id),
  description: text('description'),
  isVehicleCost: integer('is_vehicle_cost', { mode: 'boolean' }).default(false),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
