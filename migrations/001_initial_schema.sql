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
