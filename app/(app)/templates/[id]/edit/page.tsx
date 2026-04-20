import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TemplateForm from "@/components/templates/TemplateForm";
import { updateTemplate } from "@/lib/actions/templates";
import type { Template } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const tmpl = data as Template;

  const boundUpdate = updateTemplate.bind(null, id);

  return (
    <div>
      <div style={s.header}>
        <Link href={`/templates/${id}`} style={s.back}>← 詳細に戻る</Link>
        <h1 style={s.heading}>{tmpl.name} — 編集</h1>
      </div>
      <div style={s.wrap}>
        <TemplateForm
          action={boundUpdate}
          cancelHref={`/templates/${id}`}
          submitLabel="更新する"
          defaultValues={{
            name:             tmpl.name,
            subject_template: tmpl.subject_template,
            body_template:    tmpl.body_template,
            is_default:       tmpl.is_default,
          }}
        />
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:  { marginBottom: "1.5rem" },
  back:    { fontSize: "0.875rem", color: "#64748b", display: "block", marginBottom: "0.4rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  wrap:    { background: "#fff", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
};
