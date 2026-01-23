import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

/**
 * データベースの状態を確認するデバッグ用API
 * 認証不要で最新の当選番号を確認できます
 */
export async function GET(request: NextRequest) {
    try {
        // 最新10件の当選番号を取得
        const latestWinningNumbers = await sql`
            SELECT 
                TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date,
                main_numbers,
                bonus_number,
                draw_number,
                created_at,
                updated_at
            FROM winning_numbers
            ORDER BY draw_date DESC
            LIMIT 10
        `

        // 全件数を取得
        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM winning_numbers
        `
        const totalCount = countResult[0]?.total || 0

        // 最新の抽選日を取得
        const latestDateResult = await sql`
            SELECT TO_CHAR(MAX(draw_date), 'YYYY-MM-DD') as latest_date
            FROM winning_numbers
        `
        const latestDate = latestDateResult[0]?.latest_date || null

        return NextResponse.json({
            success: true,
            totalCount: Number(totalCount),
            latestDate,
            latestWinningNumbers: latestWinningNumbers.map((row: any) => ({
                drawDate: row.draw_date,
                mainNumbers: row.main_numbers,
                bonusNumber: row.bonus_number,
                drawNumber: row.draw_number,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            })),
        })
    } catch (error) {
        console.error('[Debug API] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            success: false,
            error: `エラーが発生しました: ${errorMessage}`,
        }, { status: 500 })
    }
}
