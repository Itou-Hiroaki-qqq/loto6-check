# ロト6速攻チェック

ロト6の購入番号と当選番号を照合し、当選状況を瞬時に確認できるWebアプリです。

## デモ

[https://loto6-check.vercel.app/](https://loto6-check.vercel.app/)

## 機能

- **ユーザー認証** … 新規登録・ログイン（Supabase Auth）
- **番号登録** … 1～43の数字から6個を登録（重複不可）
- **当選チェック** … データベースの当選番号と照合し、1等～5等・はずれを判定
- **期間指定** … 開始日・終了日を指定してチェック（未指定時は最新10件）
- **CSVインポート** … 過去の当選データを一括インポート可能

当選番号データは別プロジェクト [loto6-auto-update](https://github.com/Itou-Hiroaki-qqq/loto6-auto-update) により、毎週月曜・木曜の夜に公式サイトから自動取得され、同一のNeonデータベースに格納されます。

## 技術スタック

| 分類 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router), React 19 |
| 言語 | TypeScript |
| スタイル | TailwindCSS, DaisyUI |
| 認証 | Supabase Auth |
| データベース | Neon (PostgreSQL) |
| デプロイ | Vercel |

## プロジェクト構成

```
├── src/
│   ├── app/
│   │   ├── api/loto6/          # API ルート
│   │   │   ├── from-db/        # 当選番号取得・判定（認証必要）
│   │   │   ├── list/           # 登録番号一覧（認証必要）
│   │   │   ├── register/      # 番号登録（認証必要）
│   │   │   ├── delete/        # 番号削除（認証必要）
│   │   │   ├── import-csv/    # CSV一括インポート
│   │   │   └── debug-db/      # DB状態確認（開発・デバッグ用）
│   │   ├── login/
│   │   ├── signup/
│   │   ├── page.tsx            # トップ（メイン画面）
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Loto6NumberInput.tsx
│   │   ├── RegisteredNumbers.tsx
│   │   └── WinningNumbersTable.tsx
│   ├── lib/
│   │   ├── loto6/              # 当選判定ロジック・型
│   │   ├── neon.ts             # DB接続
│   │   ├── supabase/           # 認証クライアント
│   │   └── db/schema.ts
│   └── middleware.ts
├── migrations/                  # DBスキーマ
├── scripts/                     # インポート用スクリプト
└── README.md
```

## セットアップ

### 必要環境

- Node.js >= 20.0.0
- npm

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/Itou-Hiroaki-qqq/loto6-check.git
cd loto6-check
npm install
```

### 2. 環境変数

プロジェクトルートに `.env.local` を作成し、以下を設定します。

```env
# Supabase（認証）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Neon（PostgreSQL）
DATABASE_URL=postgresql://user:password@xxxx.neon.tech/dbname?sslmode=require
```

- Supabase: [Supabase](https://supabase.com) でプロジェクト作成 → Settings > API から URL とキーを取得
- Neon: [Neon](https://neon.tech) でプロジェクト作成 → 接続文字列を取得

### 3. データベースの初期化

NeonのSQLエディタなどで、`migrations/001_initial_schema.sql` の内容を実行してテーブルを作成します。

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

CREATE INDEX IF NOT EXISTS idx_loto6_numbers_user_id ON loto6_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_winning_numbers_draw_date ON winning_numbers(draw_date);
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリを確認できます。

## データの投入

### 過去データのCSVインポート

当選番号の過去データはCSVから一括登録できます。手順は [IMPORT_CSV.md](./IMPORT_CSV.md) を参照してください。

- 対応形式: 回号・抽選日・本数字6個・ボーナス数字
- データ例: [ロト6 CSV解析データ](https://www.kawaninon.com/loto6/csv/) など

### 最新データの自動更新

最新の当選番号は、別リポジトリの **loto6-auto-update**（Railway + cron-job.org）が、毎週月曜・木曜の22:00に公式サイトから取得し、同じNeonデータベースに保存します。本リポジトリにはスクレイピング処理は含まれません。

- リポジトリ: [loto6-auto-update](https://github.com/Itou-Hiroaki-qqq/loto6-auto-update)
- 自動更新が動かない場合: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照

## デプロイ（Vercel）

1. [Vercel](https://vercel.com) でプロジェクトを作成し、このリポジトリを連携
2. 環境変数に以下を設定  
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
3. デプロイ

このアプリはフロント＋APIのみのため、Vercelの無料枠で運用可能です。当選番号の自動取得は loto6-auto-update 側で行います。

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [SETUP.md](./SETUP.md) | セットアップの詳細（Supabase認証設定など） |
| [IMPORT_CSV.md](./IMPORT_CSV.md) | CSVインポート手順 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 自動更新が動かないときの確認手順 |
| [RAILWAY_DELETE_PROJECT.md](./RAILWAY_DELETE_PROJECT.md) | Railwayプロジェクト削除手順（参考） |

## 注意事項

- 当選番号は公式サイト（みずほ銀行のロト6ページ）を参照しています。サイト構造変更時は loto6-auto-update 側のスクレイパー修正が必要になる場合があります。
- `/api/loto6/debug-db` は認証なしでDBの状態を返すため、本番では必要に応じて削除または制限してください。

## ライセンス

All Rights Reserved 2026 © Hiroaki Ito
