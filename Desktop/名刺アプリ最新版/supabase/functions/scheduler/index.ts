/**
 * Supabase Edge Function: scheduler
 *
 * Supabase Dashboard > Edge Functions > Deploy してから
 * Dashboard > Database > Extensions で pg_cron を有効化し、
 * supabase/migrations/006_pg_cron.sql を実行して定期呼び出しを設定する。
 *
 * 手動テスト:
 *   supabase functions invoke scheduler --no-verify-jwt
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APP_URL    = Deno.env.get("APP_URL")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

serve(async () => {
  if (!APP_URL || !CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: "APP_URL / CRON_SECRET が未設定です" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const res = await fetch(`${APP_URL}/api/scheduler`, {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
