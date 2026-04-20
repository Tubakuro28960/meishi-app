"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMailProvider } from "@/lib/mail";
import { GmailProvider } from "@/lib/mail/gmail";
import { revalidatePath } from "next/cache";

export type ImmediateJobInput = {
  business_card_id: string;
  template_id: string;
  to_email: string;
  subject: string;
  body: string;
};

export async function recordImmediateJobs(
  jobs: ImmediateJobInput[]
): Promise<{ error: string } | void> {
  if (jobs.length === 0) return { error: "送信対象がありません" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // Gmailトークンを取得してプロバイダを決定
  const service = createServiceClient();
  const { data: tokenRow } = await service
    .from("user_gmail_tokens")
    .select("refresh_token, gmail_email")
    .eq("user_id", user.id)
    .single();

  const provider = tokenRow?.refresh_token
    ? new GmailProvider(tokenRow.refresh_token, tokenRow.gmail_email)
    : getMailProvider();

  // 各ジョブをDBに記録してすぐに送信
  const errors: string[] = [];

  for (const job of jobs) {
    // レコード挿入（pending）
    const { data: inserted, error: insertError } = await service
      .from("send_jobs")
      .insert({
        user_id:          user.id,
        business_card_id: job.business_card_id,
        template_id:      job.template_id,
        mode:             "immediate",
        to_email:         job.to_email,
        subject:          job.subject,
        body:             job.body,
        status:           "pending",
        retry_count:      0,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      errors.push(`${job.to_email}: DB登録失敗 (${insertError?.message})`);
      continue;
    }

    const jobId = inserted.id;

    // 即時送信
    let sendResult;
    try {
      sendResult = await provider.send({
        to:      job.to_email,
        subject: job.subject,
        body:    job.body,
      });
    } catch (e) {
      sendResult = { success: false as const, error: String(e) };
    }

    // 送信結果をDBに反映
    if (sendResult.success) {
      await service
        .from("send_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", jobId);
    } else {
      await service
        .from("send_jobs")
        .update({ status: "failed", error_message: sendResult.error })
        .eq("id", jobId);
      errors.push(`${job.to_email}: ${sendResult.error}`);
    }

    // 送信ログ
    await service.from("send_logs").insert({
      send_job_id:      jobId,
      attempt_no:       1,
      result:           sendResult.success ? "success" : "failed",
      response_summary: sendResult.success
        ? `provider=${provider.name} messageId=${sendResult.messageId}`
        : sendResult.error,
    });
  }

  revalidatePath("/jobs");

  if (errors.length > 0) {
    return { error: errors.join("\n") };
  }
}

export async function recordScheduledJobs(
  jobs: ImmediateJobInput[],
  scheduledAt: string
): Promise<{ error: string } | void> {
  if (jobs.length === 0) return { error: "送信対象がありません" };
  if (!scheduledAt) return { error: "送信日時を指定してください" };

  const scheduled = new Date(scheduledAt);
  if (isNaN(scheduled.getTime()) || scheduled <= new Date()) {
    return { error: "送信日時は現在より後の日時を指定してください" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const records = jobs.map((job) => ({
    user_id: user.id,
    business_card_id: job.business_card_id,
    template_id: job.template_id,
    mode: "scheduled" as const,
    to_email: job.to_email,
    subject: job.subject,
    body: job.body,
    scheduled_at: scheduled.toISOString(),
    status: "pending" as const,
    retry_count: 0,
  }));

  const { error } = await supabase.from("send_jobs").insert(records);
  if (error) return { error: error.message };

  revalidatePath("/jobs");
}
