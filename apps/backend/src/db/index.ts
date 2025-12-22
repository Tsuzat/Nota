import { drizzle } from 'drizzle-orm/bun-sql'
import { DB_URL } from '../constants'
import * as schema from './schema'

export const DB = drizzle(DB_URL, { schema })
