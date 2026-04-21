"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DeleteTemplateButton from "@/components/templates/DeleteTemplateButton";
import DuplicateButton from "@/components/templates/DuplicateButton";
import type { Template } from "@/types/database";

type Props = { templates: Template[] };

export default function TemplatesClient({ templates }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (templates.length === 0) {
    return (
      <div style={s.empty}>
        <p>テンプレートがまだありません。</p>
        <Link href="/templates/new" style={s.emptyLink}>最初のテンプレートを作成する</Link>
      </div>
    );
  }

  return (
    <div style={s.list}>
      {templates.map(tmpl =>
        isMobile ? (
          /* ── モバイル: 縦積みカード ── */
          <div key={tmpl.id} style={s.mobileCard}>
            <div style={s.mobileTop}>
              <span style={s.mobileName}>{tmpl.name}</span>
              {tmpl.is_default && <span style={s.badge}>デフォルト</span>}
            </div>
            <p style={s.mobileSubject}>
              件名: {tmpl.subject_template || <em style={s.empty2}>（未設定）</em>}
            </p>
            <p style={s.mobileMeta}>更新: {new Date(tmpl.updated_at).toLocaleDateString("ja-JP")}</p>
            <div style={s.mobileActions}>
              <Link href={`/templates/${tmpl.id}`} style={s.detailBtn}>詳細</Link>
              <Link href={`/templates/${tmpl.id}/edit`} style={s.editBtn}>編集</Link>
              <DuplicateButton id={tmpl.id} />
              <DeleteTemplateButton id={tmpl.id} />
            </div>
          </div>
        ) : (
          /* ── デスクトップ: 横並び ── */
          <div key={tmpl.id} style={s.card}>
            <div style={s.cardMain}>
              <div style={s.cardTitle}>
                <span style={s.name}>{tmpl.name}</span>
                {tmpl.is_default && <span style={s.badge}>デフォルト</span>}
              </div>
              <p style={s.subject}>
                件名: {tmpl.subject_template || <em style={s.empty2}>（未設定）</em>}
              </p>
              <p style={s.meta}>更新: {new Date(tmpl.updated_at).toLocaleDateString("ja-JP")}</p>
            </div>
            <div style={s.cardActions}>
              <Link href={`/templates/${tmpl.id}`} style={s.detailBtn}>詳細</Link>
              <Link href={`/templates/${tmpl.id}/edit`} style={s.editBtn}>編集</Link>
              <DuplicateButton id={tmpl.id} />
              <DeleteTemplateButton id={tmpl.id} />
            </div>
          </div>
        )
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  empty:     { background: "#fff", borderRadius: 8, padding: "3rem", textAlign: "center", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  emptyLink: { display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" },
  list:      { display: "flex", flexDirection: "column", gap: "0.75rem" },

  // デスクトップ
  card:        { background: "#fff", borderRadius: 8, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  cardMain:    { flex: 1, minWidth: 0 },
  cardTitle:   { display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" },
  name:        { fontWeight: 600, fontSize: "1rem", color: "#1e293b" },
  subject:     { fontSize: "0.875rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 },
  meta:        { fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" },
  cardActions: { display: "flex", gap: "0.5rem", flexShrink: 0 },

  // モバイル
  mobileCard:    { background: "#fff", borderRadius: 8, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" },
  mobileTop:     { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" },
  mobileName:    { fontWeight: 700, fontSize: "1rem", color: "#1e293b" },
  mobileSubject: { fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem", wordBreak: "break-all" },
  mobileMeta:    { fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" },
  mobileActions: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },

  // 共通
  badge:     { padding: "0.125rem 0.5rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" },
  empty2:    { fontStyle: "italic" },
  detailBtn: { padding: "0.375rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem" },
  editBtn:   { padding: "0.375rem 0.75rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: "0.8125rem" },
};
