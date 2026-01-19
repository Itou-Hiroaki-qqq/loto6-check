import { pgTable, text, timestamp, uuid, integer, date } from 'drizzle-orm/pg-core'

// ユーザーが登録したロト6番号
export const loto6Numbers = pgTable('loto6_numbers', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // Supabase AuthのユーザーID
    numbers: integer('numbers').array().notNull(), // 6個の数字の配列 [1, 2, 3, 4, 5, 6]
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 当選番号のキャッシュ
export const winningNumbers = pgTable('winning_numbers', {
    id: uuid('id').defaultRandom().primaryKey(),
    drawDate: date('draw_date').notNull().unique(), // 抽選日
    mainNumbers: integer('main_numbers').array().notNull(), // 本数字6個
    bonusNumber: integer('bonus_number').notNull(), // ボーナス数字
    drawNumber: integer('draw_number'), // 回号（任意）
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
