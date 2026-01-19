import { neon } from '@neondatabase/serverless'
import * as schema from './db/schema'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// 手動でクエリを実行するためのヘルパー
export { sql, schema }

// Drizzleを使う場合は以下のように使用
// import { drizzle } from 'drizzle-orm/neon-http'
// export const db = drizzle(sql, { schema })
