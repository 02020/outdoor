import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { groups } from './groups'

export const routes = sqliteTable('routes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
  description: text('description'),
  regionCode: text('region_code'),
  difficulty: integer('difficulty'),
  routeType: text('route_type'),
  altitudeM: real('altitude_m'),
  elevationGainM: real('elevation_gain_m'),
  distanceKm: real('distance_km'),
  driveDistanceKm: real('drive_distance_km'),
  driveTimeMin: integer('drive_time_min'),
  estimatedTimeMin: integer('estimated_time_min'),
  bestSeason: text('best_season'),
  hasWaterSource: integer('has_water_source', { mode: 'boolean' }),
  hasCellSignal: integer('has_cell_signal', { mode: 'boolean' }),
  parkingInfo: text('parking_info'),
  sceneryTags: text('scenery_tags'),
  trackRef: text('track_ref'),
  waypointsJson: text('waypoints_json'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
})
