# ロト6速攻チェック

ロト6の当選番号をチェックするアプリケーション

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- TailwindCSS
- DaisyUI
- Supabase Auth (認証)
- Neon (PostgreSQL データベース)
- Vercel (デプロイ)

## セットアップ手順

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください。

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Neonデータベース設定
DATABASE_URL=your_neon_database_url
```

### 2. Supabaseの設定

1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成（既存のプロジェクトを使用する場合はスキップ）
3. プロジェクト設定 > API から以下を取得：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（シークレットキー）

### 3. Neonデータベースの設定

1. [Neon](https://neon.tech)にログイン
2. 新しいプロジェクトを作成（既存のプロジェクトを使用する場合はスキップ）
3. プロジェクト設定から接続文字列を取得 → `DATABASE_URL`
4. 以下のSQLを実行してテーブルを作成：

```sql
-- ロト6番号テーブル
CREATE TABLE IF NOT EXISTS loto6_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  numbers INTEGER[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 当選番号テーブル
CREATE TABLE IF NOT EXISTS winning_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date DATE NOT NULL UNIQUE,
  main_numbers INTEGER[] NOT NULL,
  bonus_number INTEGER NOT NULL,
  draw_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_loto6_numbers_user_id ON loto6_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_winning_numbers_draw_date ON winning_numbers(draw_date);
```

### 4. 依存パッケージのインストール

```bash
npm install
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 機能

- ユーザー認証（新規登録・ログイン）
- ロト6番号の登録（1～43の数字から6個、重複不可）
- 当選番号のデータベースからの取得
- CSV形式での過去データ一括インポート
- 期間指定での当選番号チェック
- 当選判定（1等～5等、はずれ）
- 判定結果の視覚的な表示

## データの取得方法

### 過去データのインポート（CSV形式）

非公式のデータソースから取得したCSVデータをインポートできます。

**CSVフォーマット例:**
```csv
回号,抽選日,本数字1,本数字2,本数字3,本数字4,本数字5,本数字6,ボーナス数字
1,2000-10-05,12,13,20,24,33,40,18
2,2000-10-12,01,04,11,23,31,37,14
...
```

**インポート方法:**

1. CSVデータを準備（配列形式に変換）
2. `/api/loto6/import-csv` エンドポイントにPOSTリクエスト：

```javascript
const csvData = [
  [1, "2000-10-05", 12, 13, 20, 24, 33, 40, 18],
  [2, "2000-10-12", 1, 4, 11, 23, 31, 37, 14],
  // ...
]

const response = await fetch('/api/loto6/import-csv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ csvData })
})
```

**データソース例:**
- [ロト6 CSV解析データ](https://www.kawaninon.com/loto6/csv/) - 第1回から最新までのCSV提供
- その他の非公式データソースサイト

### 最新データの自動更新（Puppeteer使用）

最新の当選番号を自動的に取得してデータベースに追加する機能が実装されています。

**機能概要:**
- Puppeteerを使用して公式サイトから最新の当選番号を取得
- cron.job.orgを使用して毎週火曜・金曜の朝に自動実行
- データベースへの自動格納（重複チェック付き）

**セットアップ方法:**
詳細なセットアップ手順は `AUTO_UPDATE_SETUP.md` を参照してください。

**主な手順:**
1. 環境変数 `AUTO_UPDATE_API_KEY` を設定
2. cron.job.orgでスケジュールを設定
3. 動作確認

**注意事項:**
- 公式APIは存在しないため、データソースは非公式サイトに依存します
- データの正確性は公式サイトと照合することを推奨します
- Puppeteerの実行にはVercelのServerless Functionsの制限（実行時間、メモリ）があります

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にログイン
2. 新しいプロジェクトを作成
3. GitHubリポジトリを接続
4. 環境変数を設定（上記の環境変数を設定）
5. デプロイ

### 環境変数の設定（Vercel）

Vercelダッシュボードのプロジェクト設定 > Environment Variables から以下の環境変数を設定してください：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `AUTO_UPDATE_API_KEY`（自動更新機能を使用する場合のみ）

## 注意事項

- ロト6の公式サイトの構造が変更された場合、スクレイピング機能の調整が必要になる可能性があります
- スクレイピングは公式サイトへの負荷を考慮して実装されていますが、過度なアクセスは避けてください
- 当選番号は公式サイトから取得されるため、公式サイトがメンテナンス中の場合は機能が制限される可能性があります

## ライセンス

All Rights Reserved 2026 © Hiroaki Ito
