-- send_logs テーブル（送信試行ごとの履歴）
create table if not exists send_logs (
  id               uuid primary key default gen_random_uuid(),
  send_job_id      uuid not null references send_jobs(id) on delete cascade,
  attempt_no       integer not null,
  result           text not null check (result in ('success', 'failed')),
  response_summary text,
  created_at       timestamptz not null default now()
);

-- 頻繁に参照されるジョブIDにインデックス
create index send_logs_job_idx on send_logs (send_job_id);

-- Row Level Security
alter table send_logs enable row level security;

-- ユーザーは自分の send_jobs に紐づくログのみ参照可能
-- スケジューラー（service role）は RLS をバイパスするため INSERT ポリシー不要
create policy "own_send_logs_select"
  on send_logs
  for select
  using (
    send_job_id in (
      select id from send_jobs where user_id = auth.uid()
    )
  );
