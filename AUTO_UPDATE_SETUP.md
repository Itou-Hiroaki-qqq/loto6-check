# ロト6自動更新機能のセットアップ

このドキュメントでは、Puppeteerを使用したロト6当選番号の自動更新機能のセットアップ方法を説明します。

## 概要

- **更新頻度**: 毎週火曜と金曜の朝（抽選日の翌日）
- **更新方法**: Puppeteerを使用して公式サイトから最新の当選番号を取得
- **スケジューラー**: cron.job.orgを使用

## 1. 環境変数の設定

### ローカル環境（.env.local）

`.env.local`ファイルに以下の環境変数を追加してください：

```env
AUTO_UPDATE_API_KEY=your-secure-random-api-key-here
```

**重要**: `your-secure-random-api-key-here`の部分を、強力なランダムな文字列に置き換えてください。

**APIキーの生成方法（例）**:
- オンラインツール: https://www.random.org/strings/ などで32文字以上のランダム文字列を生成
- コマンドライン: `openssl rand -hex 32`（Mac/Linux）または `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Vercel環境

1. Vercelダッシュボードにログイン: https://vercel.com/dashboard
2. プロジェクトを選択
3. **Settings** → **Environment Variables** を開く
4. 以下の環境変数を追加:

   **必須:**
   - **Name**: `AUTO_UPDATE_API_KEY`
   - **Value**: ローカルで生成したAPIキーと同じ値
   - **Environment**: Production, Preview, Development すべてにチェック

   **推奨（Puppeteer使用時）:**
   - **Name**: `CHROMIUM_REMOTE_EXEC_PATH`
   - **Value**: `https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar.br`
   - **Environment**: Production, Preview, Development すべてにチェック
   - **注意**: バージョンが異なる場合は、[GitHubリリースページ](https://github.com/Sparticuz/chromium/releases)から最新のv143系のURLを確認してください

5. **Save** をクリック

## 2. cron.job.orgの設定

### ステップ1: cron.job.orgにアクセス

1. https://cron-job.org/ にアクセス
2. アカウントを作成（無料プランで利用可能）
3. ログイン

### ステップ2: 新しいCron Jobを作成

1. ダッシュボードで **「Create cronjob」** または **「新しいCronjob」** をクリック

### ステップ3: Cron Jobの設定

以下の設定を行ってください：

#### 基本設定

- **Title**: `ロト6自動更新（火曜）` または `ロト6自動更新（金曜）`
- **Address (URL)**: 
  ```
  https://your-app-name.vercel.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
  ```
  - `your-app-name`をあなたのVercelアプリ名に置き換え
  - `YOUR_API_KEY`を環境変数で設定したAPIキーに置き換え

#### スケジュール設定

**火曜用の設定**:
- **Schedule**: `Custom`
- **Cron expression**: `0 6 * * 2`
  - 意味: 毎週火曜日の6時0分（UTC）
  - 日本時間（JST）に合わせる場合: `0 21 * * 1`（月曜21時 = 火曜6時JST）

**金曜用の設定**:
- **Schedule**: `Custom`
- **Cron expression**: `0 6 * * 5`
  - 意味: 毎週金曜日の6時0分（UTC）
  - 日本時間（JST）に合わせる場合: `0 21 * * 4`（木曜21時 = 金曜6時JST）

**注意**: cron.job.orgはUTC時間を使用します。日本時間（JST）はUTC+9時間です。

#### リクエスト設定

- **Request method**: `GET` または `POST`（どちらでも動作します）
- **Request headers**: 以下のヘッダーを追加（オプション、URLパラメータでも可）:
  ```
  x-api-key: YOUR_API_KEY
  ```

#### その他の設定

- **Activate cronjob**: ✅ チェックを入れる
- **Save** をクリック

### ステップ4: 2つ目のCron Jobを作成

火曜用と金曜用で2つのCron Jobを作成する必要があります。

1. 上記の手順を繰り返して、もう1つのCron Jobを作成
2. タイトルとCron expressionを適切に変更

## 3. 動作確認

### 手動テスト

1. ブラウザで以下のURLにアクセス（APIキーをURLに含める）:
   ```
   https://your-app-name.vercel.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
   ```

2. 正常な場合、以下のようなJSONレスポンスが返ります:
   ```json
   {
     "success": true,
     "message": "自動更新完了: 新規1件、更新0件",
     "count": 1,
     "updated": 0,
     "total": 1
   }
   ```

3. データベースを確認して、最新の当選番号が追加されているか確認

### cron.job.orgでのテスト

1. cron.job.orgのダッシュボードで作成したCron Jobを選択
2. **「Run now」** または **「今すぐ実行」** をクリック
3. 実行履歴で結果を確認
4. エラーが発生した場合は、ログを確認して問題を特定

## 4. トラブルシューティング

### エラー: "Unauthorized"

- APIキーが正しく設定されているか確認
- URLパラメータまたはヘッダーにAPIキーが含まれているか確認

### エラー: "No winning numbers found"

- 公式サイトのHTML構造が変更された可能性
- Puppeteerスクレイパーのログを確認
- `/api/loto6/test-scraper`エンドポイントでテスト

### タイムアウトエラー

- VercelのServerless Functionsの実行時間制限（Proプランで最大60秒）
- Puppeteerの処理が重い場合は、タイムアウト設定を調整

### データベース接続エラー

- Neonデータベースの接続情報が正しく設定されているか確認
- Vercelの環境変数に`DATABASE_URL`が設定されているか確認

## 5. ログの確認

### Vercelのログ

1. Vercelダッシュボード → プロジェクト → **Logs** タブ
2. 自動更新APIの実行ログを確認

### cron.job.orgのログ

1. cron.job.orgのダッシュボード → Cron Jobを選択
2. **「Execution history」** または **「実行履歴」** を確認
3. エラーメッセージやHTTPステータスコードを確認

## 6. セキュリティに関する注意事項

1. **APIキーの管理**
   - APIキーは機密情報として扱う
   - GitHubなどの公開リポジトリにコミットしない
   - `.env.local`は`.gitignore`に含まれていることを確認

2. **アクセス制限**
   - cron.job.orgからのみアクセスできるようにする
   - 必要に応じて、Vercelの設定でIPアドレス制限を追加（cron.job.orgのIPアドレスを許可）

3. **レート制限**
   - 過度なリクエストを防ぐため、APIキー認証を必須とする

## 7. 今後の拡張

- エラー通知機能（メール、Slackなど）
- 複数のデータソースからの取得
- 過去データの一括インポート機能
