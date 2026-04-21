"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ImmediateJobInput = {
  business_card_id: string;
  template_id: string;
  to_email: string;
  subject: string;
  body: string;
};

// mailto で開いた送信を send_jobs に記録する（実際の送信はクライアント側の mailto リンク）
export async function recordImmediateJobs(
  jobs: ImmediateJobInput[]
): Promise<{ error: string } | void> {
  if (jobs.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const rows = jobs.map(job => ({
    business_card_id: job.business_card_id,
    template_id:      job.template_id,
    mode:             "immediate",
    to_email:         job.to_email,
    subject:          job.subject,
    body:             job.body,
    status:           "sent",
    retry_count:      0,
    sent_at:          new Date().toISOString(),
  }));

  const { error } = await supabase.from("send_jobs").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/cards");
}
