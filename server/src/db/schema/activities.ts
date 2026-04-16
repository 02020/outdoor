import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { groups } from './groups'
import { routes } from './routes'

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
  date: text('date').notNull(),
  location: text('location'),
  routeId: integer('route_id').references(() => routes.id),
  splitMode: text('split_mode', { enum: ['all_split', 'per_car'] }).notNull(),
  reimburseMode: text('reimburse_mode', { enum: ['balance', 'cash'] }).notNull().default('balance'),
  status: text('status', { enum: ['draft', 'settled', 'reversed'] }).notNull().default('draft'),
  totalCost: real('total_cost'),
  unitPrice: real('unit_price'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  settledAt: integer('settled_at', { mode: 'number' }),
})
