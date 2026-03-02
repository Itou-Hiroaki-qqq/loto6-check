# 自動更新が動作しない場合のトラブルシューティング

## 確認手順

### 1. Cloud Run のログを確認

1. [Google Cloud Console](https://console.cloud.google.com) にログイン
2. **「Cloud Run」** → `loto6-auto-update` サービスを選択
3. **「ログ」** タブを開く
4. 最新のリクエストログを確認

**確認ポイント:**
- エラーメッセージがないか
- `[Auto Update]` で始まるログが出力されているか
- データベース接続エラーがないか

### 2. cron-job.org の実行履歴を確認

1. [cron-job.org](https://cron-job.org) にログイン
2. 設定したジョブを開く
3. **「Execution History」** タブを確認

**確認ポイント:**
- 月曜・木曜の夜（22時以降）に実行されているか
- 実行結果が「Success」か「Failed」か
- エラーメッセージがないか
- **重要**: 実行時刻が22:00以降になっているか（13:00など早い時刻だと公式サイトにデータがまだ公開されていない）

### 3. 手動で API をテスト

Cloud Run の URL に以下のリクエストを送って動作確認：

```bash
curl -X POST "https://<your-cloud-run-url>/api/loto6/auto-update" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**確認ポイント:**
- `{"success":true,...}` が返ってくるか
- エラーメッセージが表示されないか

### 4. 環境変数の確認

Cloud Run コンソールの **「変数とシークレット」** タブで以下が設定されているか確認：

- `DATABASE_URL` - Neon データベースの接続文字列
- `AUTO_UPDATE_API_KEY` - API キー（cron-job.org で使用しているものと同じ）

### 5. データベースの最新データを確認

Neon データベースに直接接続して、最新の当選番号が格納されているか確認：

```sql
SELECT draw_date, main_numbers, bonus_number, draw_number, updated_at
FROM winning_numbers
ORDER BY draw_date DESC
LIMIT 5;
```

## よくある原因と対処法

### 原因1: cron-job.org の設定が間違っている

**症状:** 実行履歴に実行記録がない

**対処法:**
- cron-job.org でジョブが有効になっているか確認
- 実行スケジュールが正しいか確認
  - 月曜22時 = `0 22 * * 1`
  - 木曜22時 = `0 22 * * 4`
  - または両方: `0 22 * * 1,4`
- **重要**: 実行時刻は22:00以降に設定すること（ロト6の抽選は月曜・木曜の夜に行われ、公式サイトへの反映は22:00以降）
- URL と API キーが正しいか確認

### 原因2: Cloud Run の環境変数が設定されていない

**症状:** API を手動実行すると `{"error":"API key not configured"}` が返る

**対処法:**
- Cloud Run コンソールで `AUTO_UPDATE_API_KEY` が設定されているか確認
- 環境変数を変更した場合、新しいリビジョンのデプロイが必要

### 原因3: スクレイピングが失敗している

**症状:** Cloud Run のログにスクレイピングエラーが表示される

**対処法:**
- 公式サイトの HTML 構造が変更されていないか確認
- タイムアウト設定を確認
- 手動でスクレイピングをテスト

### 原因4: データベース接続エラー

**症状:** Cloud Run のログにデータベース接続エラーが表示される

**対処法:**
- `DATABASE_URL` が正しく設定されているか確認
- Neon データベースがアクティブか確認
- 接続文字列の形式が正しいか確認（`?sslmode=require` が必要）

### 原因5: Cloud Run のデプロイが失敗している

**症状:** Cloud Run コンソールでリビジョンが「失敗」になっている

**対処法:**
- ビルドログを確認してエラーを修正
- 依存関係が正しくインストールされているか確認
- `package.json` の設定を確認
