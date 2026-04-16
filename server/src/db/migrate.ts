import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './connection'
import path from 'node:path'

console.log('Running migrations...')
migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') })
console.log('Migrations complete.')
