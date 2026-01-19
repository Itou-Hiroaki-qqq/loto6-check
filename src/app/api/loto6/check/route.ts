import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sql } from '@/lib/neon'
import { scrapeMultipleUrls, scrapeWinningNumbers } from '@/lib/loto6/scraper'
import { checkLoto6 } from '@/lib/loto6/check'
import { format, parse, startOfMonth, endOfMonth, subMonths } from 'date-fns'

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

        // ユーザーが登録した番号を取得
        const userNumbersResult = await sql`
        SELECT id, numbers
        FROM loto6_numbers
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
    `

        if (userNumbersResult.length === 0) {
            return NextResponse.json({ error: '登録された番号がありません' }, { status: 400 })
        }

        // 期間を決定
        let checkStartDate: Date
        let checkEndDate: Date = new Date()

        if (startDate) {
            checkStartDate = parse(startDate, 'yyyy-MM-dd', new Date())
        } else {
            // デフォルトで最新から10件分を取得
            checkStartDate = subMonths(new Date(), 2) // とりあえず2ヶ月前から
        }

        if (endDate) {
            checkEndDate = parse(endDate, 'yyyy-MM-dd', new Date())
        }

        // スクレイピング対象のURLを生成
        const urls: string[] = []
        const currentDate = new Date()
        const startMonth = startOfMonth(checkStartDate)
        const endMonth = endOfMonth(checkEndDate)

        // 当月分のURL
        if (endMonth >= startOfMonth(currentDate)) {
            urls.push('https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html')
        }

        // 過去1年分のURLを生成
        let checkMonth = startOfMonth(checkStartDate)
        while (checkMonth <= endMonth && checkMonth < startOfMonth(currentDate)) {
            const year = checkMonth.getFullYear()
            const month = checkMonth.getMonth() + 1
            urls.push(
                `https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/${year}${month.toString().padStart(2, '0')}.html`
            )
            checkMonth = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 1)
        }

        // 当選番号をスクレイピング
        console.log(`[API] Scraping URLs: ${urls.join(', ')}`)
        const winningNumbersList = await scrapeMultipleUrls(urls)
        console.log(`[API] Total winning numbers scraped: ${winningNumbersList.length}`)

        // 期間でフィルタリング
        const filteredWinningNumbers = winningNumbersList.filter((wn) => {
            const drawDate = parse(wn.drawDate, 'yyyy-MM-dd', new Date())
            return drawDate >= checkStartDate && drawDate <= checkEndDate
        })
        console.log(`[API] Filtered winning numbers: ${filteredWinningNumbers.length}`)

        // デフォルトで最新10件を表示
        // 期間指定がある場合は期間内の結果、ない場合は最新10件
        let displayNumbers: typeof winningNumbersList = []
        if (startDate || endDate) {
            // 期間指定がある場合
            displayNumbers = filteredWinningNumbers
        } else {
            // 期間指定がない場合は最新10件
            displayNumbers = winningNumbersList.slice(0, 10)
        }
        console.log(`[API] Display numbers: ${displayNumbers.length}`)

        // 各ユーザー番号に対して判定を実行
        const results: any[] = []

        for (const userNumberRecord of userNumbersResult) {
            const userNumbers = userNumberRecord.numbers as number[]

            for (const winning of displayNumbers) {
                const checkResult = checkLoto6(userNumbers, {
                    drawDate: winning.drawDate,
                    mainNumbers: winning.mainNumbers,
                    bonusNumber: winning.bonusNumber,
                    drawNumber: winning.drawNumber,
                })

                results.push({
                    userNumberId: userNumberRecord.id,
                    ...checkResult,
                })
            }
        }

        if (displayNumbers.length === 0) {
            console.warn('[API] No winning numbers found')
            return NextResponse.json({ 
                error: '当選番号が見つかりませんでした。公式サイトから取得できていない可能性があります。',
                results: [],
                debug: {
                    urlsTried: urls,
                    totalScraped: winningNumbersList.length,
                    filtered: filteredWinningNumbers.length,
                }
            }, { status: 200 }) // 200を返してフロントで処理できるように
        }

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[API] Error checking loto6:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ 
            error: `エラーが発生しました: ${errorMessage}`,
            results: []
        }, { status: 500 })
    }
}
