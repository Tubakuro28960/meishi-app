-- pg_cron + pg_net で Supabase Edge Function を 5 分ごとに呼び出す
-- 前提: Dashboard > Database > Extensions で pg_cron / pg_net を有効化すること

-- 既存ジョブがあれば削除してから登録（冪等）
select cron.unschedule('trigger-scheduler') where exists (
  select 1 from cron.job where jobname = 'trigger-scheduler'
);

select cron.schedule(
  'trigger-scheduler',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := current_setting('app.url') || '/api/scheduler',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- 設定値は Supabase Dashboard > Settings > Database > Configuration で登録:
--   app.url          = https://your-app.vercel.app
--   app.cron_secret  = <CRON_SECRET と同じ値>
