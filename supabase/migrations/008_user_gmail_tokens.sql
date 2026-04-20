create table if not exists user_gmail_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  gmail_email   text not null,
  refresh_token text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger user_gmail_tokens_updated_at
  before update on user_gmail_tokens
  for each row execute function update_updated_at();

alter table user_gmail_tokens enable row level security;

create policy "own_gmail_token_all"
  on user_gmail_tokens
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
