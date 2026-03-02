import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sql } from '@/lib/neon'
import { checkLoto6 } from '@/lib/loto6/check'
import { CheckResult } from '@/lib/loto6/types'

type WinningRow = {
    draw_date: string
    main_numbers: number[]
    bonus_number: number
    draw_number: number | null
}

type UserNumberRow = {
    id: string
    numbers: number[]
}

type CheckResultWithId = CheckResult & { userNumberId: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * データベースから当選番号を取得して判定
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { startDate, endDate } = body

        // 日付フォーマットのバリデーション
        if (startDate && !DATE_PATTERN.test(startDate)) {
            return NextResponse.json({ error: '開始日の形式が不正です（YYYY-MM-DD）' }, { status: 400 })
        }
        if (endDate && !DATE_PATTERN.test(endDate)) {
            return NextResponse.json({ error: '終了日の形式が不正です（YYYY-MM-DD）' }, { status: 400 })
        }

        // ユーザーが登録した番号を取得
        const userNumbersResult = await sql`
            SELECT id, numbers
            FROM loto6_numbers
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
        ` as UserNumberRow[]

        if (userNumbersResult.length === 0) {
            return NextResponse.json({ error: '登録された番号がありません' }, { status: 400 })
        }

        // データベースから当選番号を取得
        let winningNumbersList: WinningRow[] = []

        if (startDate || endDate) {
            // 期間指定がある場合
            if (startDate && endDate) {
                winningNumbersList = await sql`
                    SELECT TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date, main_numbers, bonus_number, draw_number
                    FROM winning_numbers
                    WHERE draw_date >= ${startDate}::date AND draw_date <= ${endDate}::date
                    ORDER BY draw_date DESC
                ` as WinningRow[]
            } else if (startDate) {
                winningNumbersList = await sql`
                    SELECT TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date, main_numbers, bonus_number, draw_number
                    FROM winning_numbers
                    WHERE draw_date >= ${startDate}::date
                    ORDER BY draw_date DESC
                ` as WinningRow[]
            } else if (endDate) {
                winningNumbersList = await sql`
                    SELECT TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date, main_numbers, bonus_number, draw_number
                    FROM winning_numbers
                    WHERE draw_date <= ${endDate}::date
                    ORDER BY draw_date DESC
                ` as WinningRow[]
            }
        } else {
            // 期間指定がない場合は最新10件
            winningNumbersList = await sql`
                SELECT TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date, main_numbers, bonus_number, draw_number
                FROM winning_numbers
                ORDER BY draw_date DESC
                LIMIT 10
            ` as WinningRow[]
        }

        // 各ユーザー番号に対して判定を実行
        const results: CheckResultWithId[] = []

        for (const userNumberRecord of userNumbersResult) {
            const userNumbers = userNumberRecord.numbers

            for (const winning of winningNumbersList) {
                // draw_dateは既にYYYY-MM-DD形式の文字列（TO_CHARで変換済み）
                const drawDateStr = String(winning.draw_date).split('T')[0].split(' ')[0]

                const checkResult = checkLoto6(userNumbers, {
                    drawDate: drawDateStr,
                    mainNumbers: winning.main_numbers,
                    bonusNumber: winning.bonus_number,
                    drawNumber: winning.draw_number ?? undefined,
                })

                results.push({
                    userNumberId: userNumberRecord.id,
                    ...checkResult,
                })
            }
        }

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[API] Error fetching from database:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: `エラーが発生しました: ${errorMessage}`,
            results: []
        }, { status: 500 })
    }
}
