import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

/**
 * CSVデータをインポートしてデータベースに登録
 * CSVフォーマット: 開催回,日付,第1数字,第2数字,第3数字,第4数字,第5数字,第6数字,BONUS数字
 * または配列形式: [[回号, 日付, 数字1, ..., 数字6, ボーナス], ...]
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || ''
        
        let csvData: string[][] = []
        
        if (contentType.includes('multipart/form-data')) {
            // ファイルアップロード形式
            const formData = await request.formData()
            const file = formData.get('file') as File
            
            if (!file) {
                return NextResponse.json({ error: 'CSVファイルが必要です' }, { status: 400 })
            }
            
            const text = await file.text()
            const lines = text.split('\n').filter(line => line.trim())
            
            // ヘッダー行をスキップ（1行目がヘッダーの場合）
            const startIndex = lines[0].includes('開催回') || lines[0].includes('回号') ? 1 : 0
            
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue
                
                // CSV解析（カンマ区切り、ダブルクォート対応）
                const row: string[] = []
                let current = ''
                let inQuotes = false
                
                for (let j = 0; j < line.length; j++) {
                    const char = line[j]
                    if (char === '"') {
                        inQuotes = !inQuotes
                    } else if (char === ',' && !inQuotes) {
                        row.push(current.trim())
                        current = ''
                    } else {
                        current += char
                    }
                }
                row.push(current.trim()) // 最後のカラム
                
                if (row.length >= 9) {
                    csvData.push(row)
                }
            }
        } else {
            // JSON形式（配列）
            const body = await request.json()
            csvData = body.csvData || []
        }

        if (!csvData || csvData.length === 0) {
            return NextResponse.json({ error: 'CSVデータが必要です' }, { status: 400 })
        }

        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (let rowIndex = 0; rowIndex < csvData.length; rowIndex++) {
            const row = csvData[rowIndex]
            
            try {
                // CSV行のフォーマット: [開催回, 日付, 第1数字, ..., 第6数字, BONUS数字]
                if (row.length < 9) {
                    errorCount++
                    errors.push(`行${rowIndex + 1}: 列数が不足 (${row.length}列)`)
                    continue
                }

                const drawNumber = parseInt(row[0], 10)
                let drawDate = row[1].trim()
                const mainNumbers = [
                    parseInt(row[2], 10),
                    parseInt(row[3], 10),
                    parseInt(row[4], 10),
                    parseInt(row[5], 10),
                    parseInt(row[6], 10),
                    parseInt(row[7], 10),
                ]
                const bonusNumber = parseInt(row[8], 10)

                // バリデーション
                if (isNaN(drawNumber) || mainNumbers.some(n => isNaN(n)) || isNaN(bonusNumber)) {
                    errorCount++
                    errors.push(`行${rowIndex + 1}: 不正な数値 (回号=${row[0]}, 日付=${drawDate})`)
                    continue
                }

                // 日付フォーマット変換
                // YYYY/MM/DD -> YYYY-MM-DD
                // YYYY-MM-DD -> YYYY-MM-DD（そのまま）
                // YYYY年MM月DD日 -> YYYY-MM-DD
                let normalizedDate = drawDate
                if (drawDate.includes('/')) {
                    const parts = drawDate.split('/')
                    if (parts.length === 3) {
                        normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
                    }
                } else if (drawDate.includes('年')) {
                    const match = drawDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
                    if (match) {
                        const [, year, month, day] = match
                        normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                    }
                }

                if (!normalizedDate.match(/\d{4}-\d{2}-\d{2}/)) {
                    errorCount++
                    errors.push(`行${rowIndex + 1}: 不正な日付フォーマット (${drawDate})`)
                    continue
                }

                // 本数字をソート
                const sortedNumbers = mainNumbers.sort((a, b) => a - b)
                const numbersString = `{${sortedNumbers.join(',')}}`

                // データベースに登録（UPSERT）
                await sql`
                    INSERT INTO winning_numbers (draw_date, main_numbers, bonus_number, draw_number, created_at, updated_at)
                    VALUES (${normalizedDate}::date, ${numbersString}::integer[], ${bonusNumber}, ${drawNumber}, NOW(), NOW())
                    ON CONFLICT (draw_date) 
                    DO UPDATE SET
                        main_numbers = EXCLUDED.main_numbers,
                        bonus_number = EXCLUDED.bonus_number,
                        draw_number = EXCLUDED.draw_number,
                        updated_at = NOW()
                `

                successCount++
            } catch (error) {
                errorCount++
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`行${rowIndex + 1}: ${errorMessage} - ${row.join(',')}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `インポート完了: ${successCount}件成功, ${errorCount}件失敗`,
            successCount,
            errorCount,
            totalRows: csvData.length,
            errors: errors.slice(0, 10), // 最初の10件のみ返す
        })
    } catch (error) {
        console.error('[API] Error importing CSV:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: `エラーが発生しました: ${errorMessage}`,
        }, { status: 500 })
    }
}
