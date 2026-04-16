import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const members = sqliteTable('members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  outdoorTitle: text('outdoor_title'),
  hasCar: integer('has_car', { mode: 'boolean' }).notNull().default(false),
  hasLicense: integer('has_license', { mode: 'boolean' }).notNull().default(false),
  experienceLevel: text('experience_level', { enum: ['beginner', 'elementary', 'intermediate', 'senior'] }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
