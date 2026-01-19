# CSVインポート手順

ロト6の過去データをCSVファイルからデータベースにインポートする方法

## 方法1: ブラウザのコンソールから（推奨）

1. ブラウザで開発者ツールを開く（F12キー）
2. Consoleタブを開く
3. 以下のコードを実行：

```javascript
// CSVファイルを選択
const input = document.createElement('input')
input.type = 'file'
input.accept = '.csv'
input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
        const response = await fetch('/api/loto6/import-csv', {
            method: 'POST',
            body: formData,
        })
        
        const result = await response.json()
        console.log('インポート結果:', result)
        
        if (result.success) {
            alert(`✅ ${result.successCount}件のデータをインポートしました`)
        } else {
            alert(`❌ エラー: ${result.error}`)
        }
    } catch (error) {
        console.error('エラー:', error)
        alert('インポート中にエラーが発生しました')
    }
}
input.click()
```

## 方法2: curlコマンド

```bash
curl -X POST http://localhost:3000/api/loto6/import-csv \
  -F "file=@path/to/your/file.csv"
```

## 方法3: PostmanやThunder Clientを使用

1. POST リクエストを `http://localhost:3000/api/loto6/import-csv` に送信
2. Body を `form-data` に設定
3. Key: `file`, Type: `File`, Value: CSVファイルを選択
4. 送信

## CSVフォーマット

CSVファイルは以下の形式である必要があります：

```csv
開催回,日付,第1数字,第2数字,第3数字,第4数字,第5数字,第6数字,BONUS数字
1,2000-10-05,12,13,20,24,33,40,18
2,2000-10-12,01,04,11,23,31,37,14
...
```

**注意事項:**
- ヘッダー行がある場合は自動でスキップされます
- 日付は `YYYY-MM-DD`, `YYYY/MM/DD`, `YYYY年MM月DD日` のいずれかの形式に対応
- 重複する日付のデータがある場合、最新のデータで上書きされます（UPSERT）

## インポート結果の確認

インポート後、以下の方法で確認できます：

1. アプリのトップページで「当選番号チェック」を実行
2. または、データベースで直接確認

## トラブルシューティング

### エラー: "列数が不足"
- CSVファイルの列数が9列（開催回、日付、6つの数字、ボーナス数字）であることを確認してください

### エラー: "不正な数値"
- 数字の列に数値以外の文字が含まれていないか確認してください

### エラー: "不正な日付フォーマット"
- 日付の形式を確認してください（`YYYY-MM-DD` 形式が最も確実です）
