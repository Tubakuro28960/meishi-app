-- pgcrypto: gen_random_uuid() と crypt() に使用
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 事前許可アカウント管理テーブル
CREATE TABLE IF NOT EXISTS public.allowed_accounts (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email               text        NOT NULL UNIQUE,
  -- bcrypt ハッシュ (例: $2a$12$...) を格納
  -- 追加方法: INSERT INTO allowed_accounts (email, initial_password_hash, company_name)
  --           VALUES ('client@example.com', crypt('初期パスワード', gen_salt('bf', 12)), '会社名');
  initial_password_hash text      NOT NULL,
  company_name        text,
  is_active           boolean     NOT NULL DEFAULT true,
  registered_user_id  uuid        REFERENCES auth.users(id),
  used_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS有効化 (ポリシーなし = anon/authenticatedはアクセス不可)
-- service_role のみRLSをバイパスしてアクセス可能
ALTER TABLE public.allowed_accounts ENABLE ROW LEVEL SECURITY;

-- メール検索用インデックス
CREATE INDEX IF NOT EXISTS allowed_accounts_email_idx
  ON public.allowed_accounts (email);

-- コメント
COMMENT ON TABLE public.allowed_accounts IS '事前許可アカウント一覧。顧客を追加する際はここにレコードを追加する。';
COMMENT ON COLUMN public.allowed_accounts.initial_password_hash IS 'bcryptハッシュ。Supabase SQL Editorで: crypt(''パスワード'', gen_salt(''bf'', 12))';
COMMENT ON COLUMN public.allowed_accounts.registered_user_id IS '登録完了後にauth.usersのIDが設定される。NULLの間は未使用。';
