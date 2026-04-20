-- send_jobs テーブル
create table if not exists send_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  business_card_id uuid references business_cards(id) on delete set null,
  template_id      uuid references templates(id) on delete set null,
  mode             text not null check (mode in ('immediate', 'scheduled')),
  to_email         text not null,
  subject          text not null default '',
  body             text not null default '',
  scheduled_at     timestamptz,
  sent_at          timestamptz,
  status           text not null default 'pending'
                   check (status in ('pending', 'processing', 'sent', 'failed', 'canceled')),
  error_message    text,
  retry_count      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- updated_at 自動更新
create trigger send_jobs_updated_at
  before update on send_jobs
  for each row execute function update_updated_at();

-- Row Level Security
alter table send_jobs enable row level security;

create policy "own_send_jobs_all"
  on send_jobs
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scheduled_at がある未来ジョブを素早く取得するためのインデックス
create index send_jobs_scheduled_idx
  on send_jobs (status, scheduled_at)
  where status = 'pending' and scheduled_at is not null;
