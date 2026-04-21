import { createServiceClient } from "@/lib/supabase/service";
import { getMailProvider } from "@/lib/mail";
import { GmailProvider } from "@/lib/mail/gmail";
import type { MailProvider } from "@/lib/mail";

/** 1回のバッチで処理するジョブ数の上限 */
const BATCH_SIZE = 50;

/** 最大リトライ回数（この回数に達したら failed 確定） */
const MAX_RETRIES = 3;

/** リトライ時の待機時間（分）。試行回数に比例して増加 */
const RETRY_DELAY_MIN = 5;

/** processing のまま更新されていないジョブをリセットするしきい値（分） */
const STALE_PROCESSING_MIN = 10;

export type ProcessResult = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

async function getProviderForUser(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<MailProvider> {
  const { data } = await supabase
    .from("user_gmail_tokens")
    .select("refresh_token, gmail_email")
    .eq("user_id", userId)
    .single();

  if (data?.refresh_token) {
    return new GmailProvider(data.refresh_token, data.gmail_email);
  }
  return getMailProvider();
}

export async function processScheduledJobs(): Promise<ProcessResult> {
  const supabase = createServiceClient();
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

  // ── 0. 長時間 processing のまま止まっているジョブをリセット ──────────────
  // クラッシュ等で processing のまま放置されたジョブを pending に戻す
  const staleThreshold = new Date(
    Date.now() - STALE_PROCESSING_MIN * 60_000
  ).toISOString();

  await supabase
    .from("send_jobs")
    .update({ status: "pending" })
    .eq("status", "processing")
    .eq("mode", "scheduled")
    .lt("updated_at", staleThreshold);

  // ── 1. 実行対象ジョブを取得 ─────────────────────────────────────────────
  const { data: jobs, error: fetchError } = await supabase
    .from("send_jobs")
    .select("id, user_id, to_email, subject, body, retry_count")
    .eq("status", "pending")
    .eq("mode", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("[scheduler] fetch error:", fetchError.message);
    return result;
  }
  if (!jobs || jobs.length === 0) return result;

  // ── 2. 各ジョブを処理 ───────────────────────────────────────────────────
  for (const job of jobs) {
    result.processed++;
    const attemptNo = (job.retry_count as number) + 1;

    // ── 2-a. Claim（楽観的ロック）────────────────────────────────────────
    // status = 'pending' の条件付き UPDATE により、複数インスタンスが
    // 同じジョブを取ろうとしても1つだけが成功する
    const { data: claimed } = await supabase
      .from("send_jobs")
      .update({ status: "processing" })
      .eq("id", job.id)
      .eq("status", "pending") // ← ここが二重送信防止の核心
      .select("id");

    if (!claimed || claimed.length === 0) {
      // 他のインスタンスが先に取得済み → スキップ
      result.skipped++;
      continue;
    }

    // ── 2-b. メール送信 ──────────────────────────────────────────────────
    const provider = await getProviderForUser(supabase, job.user_id as string);
    let sendResult;
    try {
      sendResult = await provider.send({
        to:      job.to_email as string,
        subject: job.subject  as string,
        body:    job.body     as string,
      });
    } catch (e) {
      sendResult = { success: false as const, error: String(e) };
    }

    // ── 2-c. ジョブステータスを更新 ──────────────────────────────────────
    if (sendResult.success) {
      await supabase
        .from("send_jobs")
        .update({
          status:        "sent",
          sent_at:       new Date().toISOString(),
          error_message: null,
        })
        .eq("id", job.id);

      result.succeeded++;
    } else {
      const willRetry = attemptNo < MAX_RETRIES;

      if (willRetry) {
        // 指数バックオフ: 試行回数 × RETRY_DELAY_MIN 分後に再試行
        const retryAt = new Date(
          Date.now() + attemptNo * RETRY_DELAY_MIN * 60_000
        ).toISOString();

        await supabase
          .from("send_jobs")
          .update({
            status:        "pending",
            retry_count:   attemptNo,
            scheduled_at:  retryAt,
            error_message: sendResult.error,
          })
          .eq("id", job.id);
      } else {
        // リトライ上限到達 → 最終失敗
        await supabase
          .from("send_jobs")
          .update({
            status:        "failed",
            retry_count:   attemptNo,
            error_message: sendResult.error,
          })
          .eq("id", job.id);
      }

      result.failed++;
    }

    // ── 2-d. 送信ログを記録 ─────────────────────────────────────────────
    await supabase.from("send_logs").insert({
      send_job_id:      job.id,
      attempt_no:       attemptNo,
      result:           sendResult.success ? "success" : "failed",
      response_summary: sendResult.success
        ? `provider=${provider.name} messageId=${sendResult.messageId}`
        : sendResult.error,
    });
  }

  return result;
}
