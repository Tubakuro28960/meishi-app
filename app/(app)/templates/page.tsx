import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteTemplateButton from "@/components/templates/DeleteTemplateButton";
import DuplicateButton from "@/components/templates/DuplicateButton";
import type { Template } from "@/types/database";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>テンプレート</h1>
        <Link href="/templates/new" style={s.addBtn}>+ 新規作成</Link>
      </div>

      {error && <p style={s.errorMsg}>{error.message}</p>}

      {!templates || templates.length === 0 ? (
        <div style={s.empty}>
          <p>テンプレートがまだありません。</p>
          <Link href="/templates/new" style={s.emptyLink}>最初のテンプレートを作成する</Link>
        </div>
      ) : (
        <div style={s.list}>
          {(templates as Template[]).map((tmpl) => (
            <div key={tmpl.id} style={s.card}>
              <div style={s.cardMain}>
                <div style={s.cardTitle}>
                  <span style={s.name}>{tmpl.name}</span>
                  {tmpl.is_default && <span style={s.badge}>デフォルト</span>}
                </div>
                <p style={s.subject}>
                  件名: {tmpl.subject_template || <em style={s.empty2}>（未設定）</em>}
                </p>
                <p style={s.meta}>
                  更新: {new Date(tmpl.updated_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <div style={s.cardActions}>
                <Link href={`/templates/${tmpl.id}`} style={s.detailBtn}>詳細</Link>
                <Link href={`/templates/${tmpl.id}/edit`} style={s.editBtn}>編集</Link>
                <DuplicateButton id={tmpl.id} />
                <DeleteTemplateButton id={tmpl.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading:      { fontSize: "1.5rem", fontWeight: 700 },
  addBtn:       { background: "#2563eb", color: "#fff", padding: "0.5rem 1rem", borderRadius: 4, fontSize: "0.875rem" },
  errorMsg:     { color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
  empty:        { background: "#fff", borderRadius: 8, padding: "3rem", textAlign: "center", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  emptyLink:    { display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" },
  list:         { display: "flex", flexDirection: "column", gap: "0.75rem" },
  card:         { background: "#fff", borderRadius: 8, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  cardMain:     { flex: 1, minWidth: 0 },
  cardTitle:    { display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" },
  name:         { fontWeight: 600, fontSize: "1rem", color: "#1e293b" },
  badge:        { padding: "0.125rem 0.5rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 },
  subject:      { fontSize: "0.875rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 },
  meta:         { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" },
  empty2:       { fontStyle: "italic" },
  cardActions:  { display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" },
  detailBtn:    { padding: "0.375rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem" },
  editBtn:      { padding: "0.375rem 0.75rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: "0.8125rem" },
};
