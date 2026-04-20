"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function retryJob(jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "認証が必要です" };

  const { error } = await supabase
    .from("send_jobs")
    .update({
      status:        "pending",
      retry_count:   0,
      scheduled_at:  new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .eq("status", "failed");

  if (error) return { error: error.message };
  revalidatePath("/jobs");
}

export async function cancelJob(jobId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "認証が必要です" };

  const { error } = await supabase
    .from("send_jobs")
    .update({ status: "canceled" })
    .eq("id", jobId)
    .eq("user_id", user.id)
    .in("status", ["pending", "failed"]);

  if (error) return { error: error.message };
  revalidatePath("/jobs");
}
