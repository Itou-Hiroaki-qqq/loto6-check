import { NextResponse } from 'next/server'
import { sql } from '@/lib/neon'
import { scrapeWinningNumbers } from '@/lib/loto6/scraper'

/**
 * スクレイピングした当選番号をデータベースに保存
 * 既存のデータは更新（upsert）
 */
export async function POST() {
    try {
        // 最新の当選番号をスクレイピング
        const url = 'https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html'
        const results = await scrapeWinningNumbers(url)

        let savedCount = 0
        let updatedCount = 0

        for (const result of results) {
            const numbersString = `{${result.mainNumbers.join(',')}}`

            try {
                // PostgreSQLのUPSERT（INSERT ... ON CONFLICT ... DO UPDATE）
                await sql`
                    INSERT INTO winning_numbers (draw_date, main_numbers, bonus_number, draw_number, created_at, updated_at)
                    VALUES (${result.drawDate}::date, ${numbersString}::integer[], ${result.bonusNumber}, ${result.drawNumber || null}, NOW(), NOW())
                    ON CONFLICT (draw_date) 
                    DO UPDATE SET
                        main_numbers = EXCLUDED.main_numbers,
                        bonus_number = EXCLUDED.bonus_number,
                        draw_number = EXCLUDED.draw_number,
                        updated_at = NOW()
                `
                savedCount++
            } catch (error) {
                console.error(`Error saving ${result.drawDate}:`, error)
            }
        }

        return NextResponse.json({
            success: true,
            message: `保存完了: ${savedCount}件`,
            count: savedCount,
        })
    } catch (error) {
        console.error('[API] Error saving to database:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: `エラーが発生しました: ${errorMessage}`,
        }, { status: 500 })
    }
}
