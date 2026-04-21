"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCardsAndSchedule } from "@/lib/actions/cards";
import { renderTemplate } from "@/lib/templates/render";
import type { OcrParsed } from "@/lib/ocr/parse";
import type { Template } from "@/types/database";

type EditableFields = {
  name: string; company: string; department: string; position: string;
  email: string; phone: string; address: string; website: string; memo: string;
};

type CardData = { rawText: string; structured: OcrParsed };

type Props = {
  imagePreviewUrl: string | null;
  originalImageUrl: string;
  cards: CardData[];
  templates: Template[];
  onBack: () => void;
};

const FIELDS: { key: keyof EditableFields; label: string; type?: string; wide?: boolean }[] = [
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス", type: "email", wide: true },
  { key: "phone",      label: "電話番号", type: "tel" },
  { key: "address",    label: "住所", wide: true },
  { key: "website",    label: "Webサイト", type: "url", wide: true },
  { key: "memo",       label: "備考", wide: true },
];

function initFields(s: OcrParsed): EditableFields {
  return {
    name: s.name, company: s.company, department: s.department,
    position: s.position, email: s.email, phone: s.phone,
    address: s.address, website: s.website, memo: "",
  };
}

type MailtoLink = { label: string; href: string };

export default function MultiOcrConfirm({ imagePreviewUrl, originalImageUrl, cards, templates, onBack }: Props) {
  const router = useRouter();
  const [allValues, setAllValues] = useState<EditableFields[]>(
    cards.map(c => initFields(c.structured))
  );
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<(string | null)[]>(() => {
    const def = templates.find(t => t.is_default) ?? templates[0] ?? null;
    return cards.map(() => def?.id ?? null);
  });
  const [expanded, setExpanded] = useState<number[]>(cards.map((_, i) => i));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mailtoLinks, setMailtoLinks] = useState<MailtoLink[] | null>(null);

  function setField(idx: number, key: keyof EditableFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAllValues(prev => prev.map((v, i) => i === idx ? { ...v, [key]: e.target.value } : v));
  }

  function toggleExpand(i: number) {
    setExpanded(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    const links: MailtoLink[] = [];

    const payload = allValues.map((v, i) => {
      const templateId = selectedTemplateIds[i];
      const template = templates.find(t => t.id === templateId) ?? null;

      if (template && v.email.trim()) {
        const vars = {
          name: v.name, company: v.company, department: v.department,
          position: v.position, email: v.email, sender_name: null,
        };
        const subject = renderTemplate(template.subject_template, vars);
        const body    = renderTemplate(template.body_template, vars);

        const href =
          "mailto:" + encodeURIComponent(v.email) +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);

        const label = [v.name, v.company].filter(Boolean).join(" / ") || `名刺 ${i + 1}`;
        links.push({ label, href });
      }

      return {
        cardData: {
          ...v,
          raw_ocr_text: cards[i].rawText,
          original_image_url: originalImageUrl,
        },
        scheduledSendData: undefined,
      };
    });

    const result = await createCardsAndSchedule(payload);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (links.length > 0) {
      setMailtoLinks(links);
      setLoading(false);
    } else {
      router.push("/cards");
    }
  }

  const sendCount = selectedTemplateIds.filter(
    (id, i) => id !== null && allValues[i].email.trim()
  ).length;

  // 保存後 → メールリンク画面
  if (mailtoLinks) {
    return (
      <div style={s.resultCard}>
        <p style={s.resultTitle}>✅ {allValues.length} 枚を保存しました</p>
        <p style={s.resultSub}>以下のボタンからメールアプリを開いて送信できます</p>
        <div style={s.linkList}>
          {mailtoLinks.map((link, i) => (
            <div key={i} style={s.linkRow}>
              <span style={s.linkLabel}>{link.label}</span>
              <a href={link.href} style={s.mailBtn}>
                メールアプリを開く →
              </a>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => router.push("/cards")} style={s.doneBtn}>
          完了（名刺一覧へ）
        </button>
      </div>
    );
  }

  return (
    <div>
      {imagePreviewUrl && (
        <div style={s.imageRow}>
          <img src={imagePreviewUrl} alt="元の画像" style={s.previewImg} />
          <p style={s.imageCaption}>読み取り元の画像</p>
        </div>
      )}

      <div style={s.cardList}>
        {allValues.map((values, idx) => {
          const isOpen = expanded.includes(idx);
          const emailEmpty = !values.email.trim();
          const summary = [values.name, values.company].filter(Boolean).join(" / ") || "（未入力）";
          const templateId = selectedTemplateIds[idx];
          const selectedTemplate = templates.find(t => t.id === templateId) ?? null;

          const vars = selectedTemplate ? {
            name: values.name, company: values.company, department: values.department,
            position: values.position, email: values.email, sender_name: null,
          } : null;
          const previewSubject = vars ? renderTemplate(selectedTemplate!.subject_template, vars) : "";
          const previewBody    = vars ? renderTemplate(selectedTemplate!.body_template,    vars) : "";

          return (
            <div key={idx} style={s.card}>
              <button type="button" onClick={() => toggleExpand(idx)} style={s.cardHeader}>
                <span style={s.cardNum}>名刺 {idx + 1}</span>
                <span style={s.cardSummary}>{summary}</span>
                {templateId && (
                  <span style={s.sendBadge}>📨 送信あり</span>
                )}
                <span style={s.chevron}>{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={s.cardBody}>
                  {emailEmpty && (
                    <div style={s.warning}>
                      ⚠ メールアドレスが読み取れませんでした。手動で入力してください。
                    </div>
                  )}

                  <div style={s.grid}>
                    {FIELDS.map(({ key, label, type, wide }) => (
                      <div key={key} style={wide ? s.fullCol : s.halfCol}>
                        <label style={s.label}>{label}</label>
                        {key === "memo" ? (
                          <textarea value={values[key]} onChange={setField(idx, key)} rows={2} style={s.textarea} />
                        ) : (
                          <input
                            type={type ?? "text"}
                            value={values[key]}
                            onChange={setField(idx, key)}
                            style={{ ...s.input, ...(key === "email" && emailEmpty ? s.inputWarn : {}) }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* テンプレート選択 */}
                  <div style={s.tmplSection}>
                    <p style={s.tmplTitle}>テンプレートを選ぶ</p>
                    <div style={s.tmplList}>
                      {templates.map(t => (
                        <label key={t.id} style={{ ...s.tmplRow, ...(templateId === t.id ? s.tmplRowSelected : {}) }}>
                          <input
                            type="radio"
                            name={`template-${idx}`}
                            checked={templateId === t.id}
                            onChange={() => setSelectedTemplateIds(prev => prev.map((v, i) => i === idx ? t.id : v))}
                            style={s.radio}
                          />
                          <div style={s.tmplInfo}>
                            <span style={s.tmplName}>{t.name}</span>
                            {t.is_default && <span style={s.badge}>デフォルト</span>}
                          </div>
                        </label>
                      ))}
                      <label style={{ ...s.tmplRow, ...(templateId === null ? s.tmplRowSelected : {}) }}>
                        <input
                          type="radio"
                          name={`template-${idx}`}
                          checked={templateId === null}
                          onChange={() => setSelectedTemplateIds(prev => prev.map((v, i) => i === idx ? null : v))}
                          style={s.radio}
                        />
                        <span style={s.tmplNone}>送信しない（保存のみ）</span>
                      </label>
                    </div>

                    {/* プレビュー */}
                    {selectedTemplate && (
                      <div style={s.preview}>
                        <p style={s.previewLabel}>プレビュー</p>
                        <div style={s.previewSubject}>
                          <span style={s.previewTag}>件名</span>
                          <span style={s.previewSubjectText}>{previewSubject || "（未設定）"}</span>
                        </div>
                        <div style={s.previewBodyWrap}>
                          <span style={s.previewTag}>本文</span>
                          <pre style={s.previewBody}>{previewBody || "（未設定）"}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.actions}>
        <button type="button" onClick={onBack} style={s.backBtn} disabled={loading}>
          ← 撮り直す
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...s.saveBtn, ...(loading ? s.saveBtnDisabled : {}) }}
        >
          {loading
            ? "処理中..."
            : sendCount > 0
            ? `全 ${allValues.length} 枚を保存してメールアプリを開く →`
            : `全 ${allValues.length} 枚を保存する`}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  imageRow: { marginBottom: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" },
  previewImg: { maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 4, border: "1px solid #e2e8f0" },
  imageCaption: { fontSize: "0.8125rem", color: "#94a3b8" },

  cardList: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" },
  card: { border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  cardHeader: { width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "#f8fafc", border: "none", cursor: "pointer", textAlign: "left" },
  cardNum: { fontWeight: 700, fontSize: "0.9375rem", color: "#1e40af", flexShrink: 0 },
  cardSummary: { flex: 1, fontSize: "0.875rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sendBadge: { fontSize: "0.75rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "0.1rem 0.5rem", fontWeight: 600, flexShrink: 0 },
  chevron: { fontSize: "0.75rem", color: "#94a3b8", flexShrink: 0 },
  cardBody: { padding: "1rem 1.25rem 1.25rem" },

  warning: { background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 4, padding: "0.5rem 0.75rem", fontSize: "0.8125rem", marginBottom: "0.875rem" },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" },
  halfCol: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  fullCol: { display: "flex", flexDirection: "column", gap: "0.2rem", gridColumn: "1 / -1" },
  label: { fontSize: "0.75rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.4rem 0.6rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.875rem" },
  inputWarn: { borderColor: "#fcd34d", background: "#fffbeb" },
  textarea: { padding: "0.4rem 0.6rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.875rem", resize: "vertical" },

  tmplSection: { marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" },
  tmplTitle: { fontSize: "0.875rem", fontWeight: 700, color: "#374151", marginBottom: "0.625rem" },
  tmplList: { display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.75rem" },
  tmplRow: { display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", background: "#f8fafc" },
  tmplRowSelected: { border: "1px solid #93c5fd", background: "#eff6ff" },
  radio: { flexShrink: 0, cursor: "pointer" },
  tmplInfo: { display: "flex", alignItems: "center", gap: "0.375rem" },
  tmplName: { fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" },
  badge: { padding: "0.1rem 0.4rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600 },
  tmplNone: { fontSize: "0.875rem", color: "#64748b" },

  preview: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "0.75rem" },
  previewLabel: { fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" },
  previewSubject: { display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" },
  previewTag: { fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", flexShrink: 0, background: "#e2e8f0", borderRadius: 3, padding: "0.1rem 0.35rem" },
  previewSubjectText: { fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" },
  previewBodyWrap: { display: "flex", gap: "0.5rem", alignItems: "flex-start" },
  previewBody: { fontSize: "0.8rem", color: "#475569", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit", lineHeight: 1.65, maxHeight: 180, overflowY: "auto" },

  error: { color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.75rem" },

  actions: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { padding: "0.5rem 1rem", background: "transparent", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.875rem", color: "#374151", cursor: "pointer" },
  saveBtn: { padding: "0.625rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer" },
  saveBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },

  resultCard: { padding: "2rem 1.5rem", background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", maxWidth: 560, margin: "0 auto" },
  resultTitle: { fontSize: "1.125rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.375rem" },
  resultSub: { fontSize: "0.9rem", color: "#64748b", marginBottom: "1.5rem" },
  linkList: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.75rem" },
  linkRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc" },
  linkLabel: { fontSize: "0.9375rem", color: "#1e293b", fontWeight: 500 },
  mailBtn: { padding: "0.4rem 1rem", background: "#2563eb", color: "#fff", borderRadius: 4, fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", flexShrink: 0 },
  doneBtn: { padding: "0.5rem 1.5rem", background: "#475569", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
};
