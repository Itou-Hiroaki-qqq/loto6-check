# Railwayへの移行手順

このドキュメントでは、VercelからRailwayへの移行手順を説明します。RailwayはPuppeteerが動作しやすい環境です。

## 1. Railwayアカウントの作成

1. **Railwayにアクセス**: https://railway.app/
2. **「Start a New Project」**または**「Login」**をクリック
3. **GitHubアカウントでログイン**を選択（推奨）
   - GitHubアカウントでログインすると、リポジトリの接続が簡単になります
4. 必要に応じて、Railwayの利用規約に同意

## 2. プロジェクトの作成

1. Railwayダッシュボードで**「New Project」**をクリック
2. **「Deploy from GitHub repo」**を選択
3. GitHubリポジトリ一覧から**`loto6-check`**を選択
4. **「Deploy Now」**をクリック

## 3. 環境変数の設定

Railwayダッシュボードで、プロジェクトを開き、**「Variables」**タブをクリックします。

以下の環境変数を追加してください：

### 必須の環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `DATABASE_URL` | Neonデータベース接続文字列 | `postgresql://user:password@host/dbname` |
| `AUTO_UPDATE_API_KEY` | 自動更新用APIキー | `3b8d7b4e9b4afa3a4ae3f5ee3aac17c8...` |

### 環境変数の追加方法

1. **「Variables」**タブで**「+ New Variable」**をクリック
2. **Key**に変数名を入力
3. **Value**に値を入力
4. **「Add」**をクリック
5. すべての環境変数を追加したら、**「Redeploy」**をクリックして再デプロイ

## 4. ビルド設定の確認

Railwayは自動的にNext.jsプロジェクトを検出しますが、必要に応じて設定を確認してください。

1. **「Settings」**タブを開く
2. **「Build Command」**が`npm run build`になっているか確認
3. **「Start Command」**が`npm start`になっているか確認
4. **「Root Directory」**が空（ルートディレクトリ）になっているか確認

## 5. デプロイの確認

1. **「Deployments」**タブでデプロイの進行状況を確認
2. デプロイが完了すると、**「View Logs」**でログを確認できます
3. デプロイが成功すると、**「Settings」**タブの**「Domains」**セクションにURLが表示されます
   - 例: `https://loto6-check-production.up.railway.app`

## 6. カスタムドメインの設定（オプション）

1. **「Settings」**タブの**「Domains」**セクションで**「Custom Domain」**をクリック
2. ドメイン名を入力（例: `loto6-check.yourdomain.com`）
3. DNS設定をRailwayの指示に従って設定

## 7. cron.job.orgの設定変更

Railwayに移行したら、cron.job.orgの設定を更新する必要があります。

### ステップ1: cron.job.orgにログイン

1. https://cron-job.org/ にアクセス
2. 既存のアカウントでログイン

### ステップ2: 既存のCron Jobを編集

1. ダッシュボードで既存のCron Jobをクリック
2. **「Edit」**をクリック

### ステップ3: URLを更新

**URL**フィールドを以下のように変更：

```
https://your-railway-app.up.railway.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
```

**重要**: 
- `your-railway-app`の部分を、Railwayの**「Settings」**→**「Domains」**に表示されている実際のドメイン名に置き換えてください
- `YOUR_API_KEY`の部分を、`AUTO_UPDATE_API_KEY`に設定した値に置き換えてください

### ステップ4: スケジュールの確認

- **Schedule**: `0 9 * * 2,5`（毎週火曜と金曜の9時）
- または、**「Every Tuesday and Friday at 9:00 AM」**を選択

### ステップ5: 保存

1. **「Save」**または**「Update」**をクリック
2. **「Enable job」**にチェックが入っていることを確認

## 8. 動作確認

### 手動テスト

ブラウザで以下のURLにアクセスしてテスト：

```
https://your-railway-app.up.railway.app/api/loto6/auto-update?apiKey=YOUR_API_KEY
```

**期待される結果**:
```json
{
  "success": true,
  "message": "自動更新完了: 新規X件、更新Y件",
  "count": X,
  "updated": Y,
  "total": Z
}
```

### cron.job.orgからのテスト実行

1. cron.job.orgのダッシュボードで、該当のCron Jobを開く
2. **「Run now」**または**「Test」**ボタンをクリック
3. 実行ログを確認

## 9. RailwayでのPuppeteer設定

Railwayでは、追加の設定は不要です。`package.json`に既に`@sparticuz/chromium`と`puppeteer-core`が含まれているため、自動的に動作します。

ただし、メモリ不足が発生する場合は、Railwayの**「Settings」**→**「Resources」**でメモリを増やすことができます。

## 10. ログの確認

Railwayでは、リアルタイムでログを確認できます：

1. **「Deployments」**タブで最新のデプロイをクリック
2. **「View Logs」**をクリック
3. ログがリアルタイムで表示されます

エラーが発生した場合は、ログを確認して問題を特定してください。

## トラブルシューティング

### デプロイが失敗する場合

1. **「Deployments」**タブで失敗したデプロイをクリック
2. **「View Logs」**でエラーメッセージを確認
3. よくある原因：
   - 環境変数が設定されていない
   - ビルドエラー
   - 依存関係のインストールエラー

### Puppeteerが動作しない場合

1. Railwayのログを確認
2. メモリ不足の可能性がある場合は、**「Settings」**→**「Resources」**でメモリを増やす
3. `package.json`の`@sparticuz/chromium`のバージョンを確認

### APIが500エラーを返す場合

1. Railwayのログを確認
2. 環境変数が正しく設定されているか確認
3. データベース接続が正常か確認

## RailwayとVercelの違い

| 項目 | Vercel | Railway |
|------|--------|---------|
| Puppeteerサポート | 制限あり | 良好 |
| 無料プラン | あり | あり（$5クレジット/月） |
| デプロイ速度 | 高速 | やや遅い |
| カスタマイズ性 | 制限あり | 高い |
| ログ確認 | 可能 | 可能（リアルタイム） |

## 次のステップ

1. Railwayでのデプロイが成功したら、Vercelのプロジェクトは削除しても構いません
2. cron.job.orgの設定を更新
3. 動作確認
4. 必要に応じて、カスタムドメインを設定

## 参考リンク

- [Railway公式ドキュメント](https://docs.railway.app/)
- [Railwayダッシュボード](https://railway.app/dashboard)
- [cron.job.org](https://cron-job.org/)
