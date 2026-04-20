-- templates テーブル
create table if not exists templates (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  subject_template text not null default '',
  body_template    text not null default '',
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- updated_at 自動更新（update_updated_at 関数は 001 で作成済み）
create trigger templates_updated_at
  before update on templates
  for each row execute function update_updated_at();

-- Row Level Security
alter table templates enable row level security;

create policy "own_templates_all"
  on templates
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ================================================================
-- サンプルテンプレートの挿入は UI の「サンプルを読み込む」ボタンから
-- 行ってください。SQL での挿入は user_id が不明なため省略します。
-- ================================================================
