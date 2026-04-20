"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getMailProvider } from "@/lib/mail";
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

  const provider = getMailProvider();
  const service = createServiceClient();
  const errors: string[] = [];

  for (const job of jobs) {
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
