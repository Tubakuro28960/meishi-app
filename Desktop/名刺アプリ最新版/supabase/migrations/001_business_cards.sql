-- business_cards テーブル
create table if not exists business_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text,
  company     text,
  department  text,
  position    text,
  email       text,
  phone       text,
  address     text,
  website     text,
  memo        text,
  status      text not null default 'unsent',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger business_cards_updated_at
  before update on business_cards
  for each row execute function update_updated_at();

-- Row Level Security: ログインユーザー自身のデータのみ操作可能
alter table business_cards enable row level security;

create policy "own_cards_all"
  on business_cards
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
