import { createClient } from "@/lib/supabase/server";
import { JobsClient }   from "@/components/jobs/JobsClient";
import type { SendJob } from "@/types/database";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("send_jobs")
    .select(
      "id, user_id, business_card_id, template_id, " +
      "to_email, subject, body, mode, status, " +
      "scheduled_at, sent_at, retry_count, error_message, " +
      "created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const jobs = (data ?? []) as unknown as SendJob[];
  const validFilters = ["all", "pending", "sent", "failed"] as const;
  type Filter = typeof validFilters[number];
  const safeFilter: Filter = (validFilters as readonly string[]).includes(filter)
    ? (filter as Filter)
    : "all";

  return <JobsClient jobs={jobs} initialFilter={safeFilter} />;
}
