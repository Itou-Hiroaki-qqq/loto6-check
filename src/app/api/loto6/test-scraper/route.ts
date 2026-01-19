import { NextResponse } from 'next/server'
import { scrapeWinningNumbers } from '@/lib/loto6/scraper'

export async function GET() {
    try {
        // テスト用URL
        const testUrl = 'https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html'
        
        console.log('[Test Scraper] Starting test scrape...')
        const results = await scrapeWinningNumbers(testUrl)
        
        return NextResponse.json({
            success: true,
            url: testUrl,
            count: results.length,
            results: results.slice(0, 5), // 最初の5件だけ返す
        })
    } catch (error) {
        console.error('[Test Scraper] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            success: false,
            error: errorMessage,
        }, { status: 500 })
    }
}
