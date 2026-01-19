# セットアップガイド（詳細版）

このドキュメントでは、ロト6速攻チェックアプリのセットアップ手順を詳細に説明します。

## ステップ1: 環境変数ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成します。このファイルは `.gitignore` に含まれているため、Gitにはコミットされません。

`.env.local` ファイルの例：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://user:password@xxxxx.neon.tech/dbname?sslmode=require
AUTO_UPDATE_API_KEY=your-secure-random-api-key-here
```

**注意**: `AUTO_UPDATE_API_KEY`は自動更新機能を使用する場合のみ必要です。詳細は`AUTO_UPDATE_SETUP.md`を参照してください。

## ステップ2: Supabaseの設定

### 2.1 プロジェクト作成

1. https://supabase.com にアクセス
2. サインイン（GoogleアカウントなどでOK）
3. 「New Project」をクリック
4. プロジェクト名とパスワードを入力してプロジェクトを作成

### 2.2 APIキーの取得

1. プロジェクトの左サイドバーから「Settings」→「API」を選択
2. 以下のキーをコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` に設定
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` に設定（⚠️ シークレットキーなので公開しないこと）

### 2.3 認証設定（重要）

Supabaseの認証設定をカスタマイズする必要があります：

1. プロジェクトの左サイドバーから「Authentication」→「Settings」を選択
2. 「Email Auth」セクションで以下を設定：
   - **開発環境の場合**：`Confirm email` のチェックを外す（メール確認なしでログイン可能に）
     - これにより、新規登録後すぐにログインできるようになります
   - **本番環境の場合**：`Confirm email` にチェックを入れる（セキュリティのため推奨）
     - この場合、新規登録後に確認メールが送信されます
     - 確認メールのリンクをクリックしてからログインできるようになります

**注意**: 開発環境でメール確認を無効にしている場合、本番環境では有効にすることを推奨します。

## ステップ3: Neonデータベースの設定

### 3.1 プロジェクト作成

1. https://neon.tech にアクセス
2. サインイン（GitHubアカウントなどでOK）
3. 「Create a project」をクリック
4. プロジェクト名を入力してプロジェクトを作成

### 3.2 接続文字列の取得

1. プロジェクトダッシュボードで「Connection Details」を選択
2. 「Connection string」から `postgresql://...` で始まる接続文字列をコピー
3. `.env.local` の `DATABASE_URL` に設定

### 3.3 テーブルの作成

NeonのSQLエディタまたはお好きなPostgreSQLクライアント（pgAdmin、DBeaverなど）で以下のSQLを実行：

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

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_loto6_numbers_user_id ON loto6_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_winning_numbers_draw_date ON winning_numbers(draw_date);
```

## ステップ4: プロジェクトのセットアップ

### 4.1 依存パッケージのインストール

```bash
npm install
```

### 4.2 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## ステップ5: 動作確認

1. 新規登録ページ（`/signup`）でアカウントを作成
2. ログインページ（`/login`）でログイン
3. トップページで以下を確認：
   - ロト6番号の登録ができる
   - 登録した番号が表示される
   - 当選番号チェックができる

## トラブルシューティング

### 環境変数が読み込まれない

- `.env.local` ファイルがプロジェクトルートにあることを確認
- 環境変数名に誤字がないか確認
- 開発サーバーを再起動（`Ctrl+C` で停止してから `npm run dev` で再起動）

### Supabase認証エラー

- `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
- Supabaseのプロジェクトが有効になっているか確認

### データベース接続エラー

- `DATABASE_URL` が正しいか確認
- Neonのプロジェクトが有効になっているか確認
- テーブルが正しく作成されているか確認

### スクレイピングエラー

- ロト6の公式サイト（https://www.mizuhobank.co.jp/takarakuji/check/loto/loto6/index.html）にアクセスできるか確認
- 公式サイトの構造が変更された可能性がある場合は、`src/lib/loto6/scraper.ts` を調整する必要があります

## 次のステップ

- Vercelへのデプロイ（デプロイガイドを参照）
- カスタムドメインの設定
- エラーログの監視設定
