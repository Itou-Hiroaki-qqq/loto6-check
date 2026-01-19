/**
 * CSVファイルをインポートするスクリプト
 * 使用方法: node scripts/import-csv.js <CSVファイルパス>
 */

const fs = require('fs')
const path = require('path')

async function importCSV(csvFilePath) {
    try {
        // CSVファイルを読み込み
        const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
        const lines = csvContent.split('\n').filter(line => line.trim())
        
        // ヘッダー行をスキップ
        const startIndex = lines[0].includes('開催回') || lines[0].includes('回号') ? 1 : 0
        
        // APIエンドポイントに送信
        const formData = new FormData()
        const blob = new Blob([csvContent], { type: 'text/csv' })
        formData.append('file', blob, path.basename(csvFilePath))
        
        const response = await fetch('http://localhost:3000/api/loto6/import-csv', {
            method: 'POST',
            body: formData,
        })
        
        const result = await response.json()
        console.log('インポート結果:', result)
        
        if (result.success) {
            console.log(`✅ ${result.successCount}件のデータをインポートしました`)
            if (result.errorCount > 0) {
                console.log(`⚠️  ${result.errorCount}件のエラーがありました`)
                if (result.errors && result.errors.length > 0) {
                    console.log('エラー詳細:')
                    result.errors.forEach(err => console.log(`  - ${err}`))
                }
            }
        } else {
            console.error('❌ インポートに失敗しました:', result.error)
        }
    } catch (error) {
        console.error('エラー:', error)
    }
}

// コマンドライン引数からファイルパスを取得
const csvFilePath = process.argv[2]
if (!csvFilePath) {
    console.error('使用方法: node scripts/import-csv.js <CSVファイルパス>')
    process.exit(1)
}

importCSV(csvFilePath)
