"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TemplateFormValues } from "@/types/database";

async function clearDefault(supabase: Awaited<ReturnType<typeof createClient>>, excludeId?: string) {
  const q = supabase.from("templates").update({ is_default: false });
  if (excludeId) q.neq("id", excludeId);
  await q;
}

export async function createTemplate(
  data: TemplateFormValues
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (data.is_default) await clearDefault(supabase);

  const { error } = await supabase.from("templates").insert(data);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  redirect("/templates");
}

export async function updateTemplate(
  id: string,
  data: TemplateFormValues
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (data.is_default) await clearDefault(supabase, id);

  const { error } = await supabase
    .from("templates")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  revalidatePath(`/templates/${id}`);
  redirect(`/templates/${id}`);
}

export async function deleteTemplate(
  id: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // send_jobs の外部キー制約を回避するため先に参照を外す
  await supabase
    .from("send_jobs")
    .update({ template_id: null })
    .eq("template_id", id);

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/templates");
}

export async function duplicateTemplate(
  id: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: original } = await supabase
    .from("templates")
    .select("name, subject_template, body_template")
    .eq("id", id)
    .single();
  if (!original) return { error: "テンプレートが見つかりません" };

  const { error } = await supabase.from("templates").insert({
    name:             `${original.name}（コピー）`,
    subject_template: original.subject_template,
    body_template:    original.body_template,
    is_default:       false,
  });
  if (error) return { error: error.message };

  revalidatePath("/templates");
  redirect("/templates");
}
