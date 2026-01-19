import { NextResponse } from 'next/server'

/**
 * HTMLの構造を確認するためのデバッグAPI
 * 公式サイトのHTMLを取得して構造を確認
 */
export async function GET() {
    try {
        const url = 'https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html'
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 500 })
        }

        const html = await response.text()
        
        // HTML全体を返す（ただし長すぎる場合は要調整）
        // または、テーブル部分だけを抽出して返す
        return NextResponse.json({
            url,
            htmlLength: html.length,
            // HTML全体は長すぎるので、最初の10000文字だけ返す
            htmlPreview: html.substring(0, 10000),
            note: 'HTML全体を確認したい場合は、ブラウザで公式サイトを開いてデベロッパーツールで確認してください',
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: `エラーが発生しました: ${errorMessage}`,
        }, { status: 500 })
    }
}
