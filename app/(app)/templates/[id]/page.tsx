import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteTemplateButton from "@/components/templates/DeleteTemplateButton";
import DuplicateButton from "@/components/templates/DuplicateButton";
import { renderTemplate, PREVIEW_SAMPLE, TEMPLATE_VARIABLES } from "@/lib/templates/render";
import type { Template } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const tmpl = data as Template;

  const previewSubject = renderTemplate(tmpl.subject_template, PREVIEW_SAMPLE);
  const previewBody    = renderTemplate(tmpl.body_template,    PREVIEW_SAMPLE);

  return (
    <div>
      {/* ヘッダー */}
      <div style={s.header}>
        <div>
          <Link href="/templates" style={s.back}>← 一覧に戻る</Link>
          <div style={s.titleRow}>
            <h1 style={s.heading}>{tmpl.name}</h1>
            {tmpl.is_default && <span style={s.badge}>デフォルト</span>}
          </div>
        </div>
        <div style={s.headerActions}>
          <Link href={`/templates/${id}/edit`} style={s.editBtn}>編集</Link>
          <DuplicateButton id={id} />
          <DeleteTemplateButton id={id} />
        </div>
      </div>

      <div style={s.grid}>
        {/* 左: テンプレート原文 */}
        <section style={s.card}>
          <h2 style={s.sectionTitle}>テンプレート原文</h2>
          <dl style={s.dl}>
            <dt style={s.dt}>件名</dt>
            <dd style={s.dd}>
              <code style={s.code}>{tmpl.subject_template || "（未設定）"}</code>
            </dd>
            <dt style={s.dt}>本文</dt>
            <dd style={s.dd}>
              <pre style={s.pre}>{tmpl.body_template || "（未設定）"}</pre>
            </dd>
          </dl>

          <div style={s.varSection}>
            <p style={s.varTitle}>使用可能な差し込み変数</p>
            <table style={s.varTable}>
              <thead>
                <tr>
                  <th style={s.th}>変数</th>
                  <th style={s.th}>意味</th>
                  <th style={s.th}>例</th>
                </tr>
              </thead>
              <tbody>
                {TEMPLATE_VARIABLES.map(({ key, label, example }) => (
                  <tr key={key}>
                    <td style={s.td}><code style={s.varCode}>{key}</code></td>
                    <td style={s.td}>{label}</td>
                    <td style={{ ...s.td, color: "#64748b" }}>{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 右: プレビュー */}
        <section style={s.card}>
          <h2 style={s.sectionTitle}>プレビュー（サンプルデータ）</h2>
          <div style={s.previewBox}>
            <p style={s.previewLabel}>件名</p>
            <p style={s.previewSubject}>
              {previewSubject || <em style={s.na}>（未設定）</em>}
            </p>
          </div>
          <div style={s.previewBox}>
            <p style={s.previewLabel}>本文</p>
            <pre style={s.previewBody}>
              {previewBody || <em style={s.na}>（未設定）</em>}
            </pre>
          </div>
          <p style={s.sampleNote}>
            ※ 「山田 太郎 / 株式会社サンプル / 営業部 / 部長」のダミーデータで表示
          </p>
        </section>
      </div>

      <p style={s.meta}>
        作成: {new Date(tmpl.created_at).toLocaleDateString("ja-JP")} ／
        更新: {new Date(tmpl.updated_at).toLocaleDateString("ja-JP")}
      </p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" },
  back:          { fontSize: "0.875rem", color: "#64748b", display: "block", marginBottom: "0.4rem" },
  titleRow:      { display: "flex", alignItems: "center", gap: "0.75rem" },
  heading:       { fontSize: "1.5rem", fontWeight: 700 },
  badge:         { padding: "0.125rem 0.625rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, fontSize: "0.8125rem", fontWeight: 600 },
  headerActions: { display: "flex", gap: "0.625rem", alignItems: "center" },
  editBtn:       { padding: "0.375rem 0.875rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: "0.875rem" },
  grid:          { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" },
  card:          { background: "#fff", borderRadius: 8, padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  sectionTitle:  { fontSize: "1rem", fontWeight: 600, color: "#1e3a5f", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" },
  dl:            { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" },
  dt:            { fontSize: "0.8125rem", fontWeight: 600, color: "#64748b" },
  dd:            { margin: 0 },
  code:          { fontFamily: "monospace", fontSize: "0.875rem", color: "#1e293b", wordBreak: "break-all" },
  pre:           { fontFamily: "monospace", fontSize: "0.875rem", color: "#1e293b", whiteSpace: "pre-wrap", margin: 0, background: "#f8fafc", padding: "0.625rem", borderRadius: 4 },
  varSection:    { borderTop: "1px solid #f1f5f9", paddingTop: "1rem" },
  varTitle:      { fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" },
  varTable:      { width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" },
  th:            { textAlign: "left", padding: "0.375rem 0.5rem", color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9" },
  td:            { padding: "0.375rem 0.5rem", borderBottom: "1px solid #f8fafc" },
  varCode:       { fontFamily: "monospace", background: "#eff6ff", color: "#1d4ed8", padding: "0.125rem 0.25rem", borderRadius: 3 },
  previewBox:    { marginBottom: "1rem" },
  previewLabel:  { fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.375rem" },
  previewSubject:{ fontSize: "0.9375rem", color: "#1e293b", padding: "0.5rem 0.625rem", background: "#f8fafc", borderRadius: 4 },
  previewBody:   { fontSize: "0.9375rem", color: "#1e293b", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, background: "#f8fafc", padding: "0.625rem", borderRadius: 4, lineHeight: 1.7 },
  sampleNote:    { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.75rem" },
  na:            { color: "#cbd5e1", fontStyle: "italic" },
  meta:          { fontSize: "0.8125rem", color: "#94a3b8" },
};
