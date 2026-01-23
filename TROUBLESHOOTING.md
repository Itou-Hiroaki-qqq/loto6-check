# 自動更新が動作しない場合のトラブルシューティング

## 確認手順

### 1. Railwayのログを確認

1. [Railwayダッシュボード](https://railway.app)にログイン
2. `loto6-auto-update` プロジェクトを選択
3. **「Deployments」**タブを開く
4. 最新のデプロイメントをクリック
5. **「View Logs」**をクリックしてログを確認

**確認ポイント:**
- エラーメッセージがないか
- `[Auto Update]` で始まるログが出力されているか
- データベース接続エラーがないか

### 2. cron-job.orgの実行履歴を確認

1. [cron-job.org](https://cron-job.org)にログイン
2. 設定したジョブを開く
3. **「Execution History」**タブを確認

**確認ポイント:**
- 木曜の夜（22時）に実行されているか
- 実行結果が「Success」か「Failed」か
- エラーメッセージがないか

### 3. 手動でAPIをテスト

以下のURLをブラウザで開いて、手動でAPIを実行してみてください：

```
https://loto6-auto-update-production.up.railway.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
```

**確認ポイント:**
- `{"success":true,...}` が返ってくるか
- エラーメッセージが表示されないか

### 4. 環境変数の確認

Railwayダッシュボードで以下の環境変数が正しく設定されているか確認：

- `DATABASE_URL` - Neonデータベースの接続文字列
- `AUTO_UPDATE_API_KEY` - APIキー（cron-job.orgで使用しているものと同じ）

### 5. データベースの最新データを確認

Neonデータベースに直接接続して、最新の当選番号が格納されているか確認：

```sql
SELECT draw_date, main_numbers, bonus_number, draw_number, updated_at
FROM winning_numbers
ORDER BY draw_date DESC
LIMIT 5;
```

## よくある原因と対処法

### 原因1: cron-job.orgの設定が間違っている

**症状:** 実行履歴に実行記録がない

**対処法:**
- cron-job.orgでジョブが有効になっているか確認
- 実行スケジュールが正しいか確認（木曜22時 = `0 22 * * 4`）
- URLとAPIキーが正しいか確認

### 原因2: Railwayの環境変数が設定されていない

**症状:** APIを手動実行すると `{"error":"API key not configured"}` が返る

**対処法:**
- Railwayダッシュボードで `AUTO_UPDATE_API_KEY` が設定されているか確認
- 環境変数を設定後、再デプロイが必要な場合がある

### 原因3: スクレイピングが失敗している

**症状:** Railwayのログにスクレイピングエラーが表示される

**対処法:**
- 公式サイトのHTML構造が変更されていないか確認
- Puppeteerのタイムアウト設定を確認
- 手動でスクレイピングをテスト

### 原因4: データベース接続エラー

**症状:** Railwayのログにデータベース接続エラーが表示される

**対処法:**
- `DATABASE_URL` が正しく設定されているか確認
- Neonデータベースがアクティブか確認
- 接続文字列の形式が正しいか確認

### 原因5: Railwayのデプロイが失敗している

**症状:** Railwayダッシュボードでデプロイが失敗している

**対処法:**
- ビルドログを確認してエラーを修正
- 依存関係が正しくインストールされているか確認
- `package.json` の設定を確認

## 緊急時の手動更新方法

自動更新が動作しない場合、手動で最新データを取得できます：

1. ブラウザで以下を開く：
   ```
   https://loto6-auto-update-production.up.railway.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
   ```

2. 成功レスポンスが返ってきたら、データベースに格納されています

3. アプリをリロードして最新データが表示されるか確認
