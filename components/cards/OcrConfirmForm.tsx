"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCard, saveCardAndReturn } from "@/lib/actions/cards";
import { renderTemplate } from "@/lib/templates/render";
import type { OcrParsed } from "@/lib/ocr/parse";
import type { Template } from "@/types/database";

type EditableFields = {
  name: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  memo: string;
};

type Props = {
  imagePreviewUrl: string | null;
  rawText: string;
  originalImageUrl: string;
  initial: OcrParsed;
  templates: Template[];
  onBack: () => void;
};

const FIELDS: {
  key: keyof EditableFields;
  label: string;
  type?: string;
  wide?: boolean;
}[] = [
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス", type: "email", wide: true },
  { key: "phone",      label: "電話番号",        type: "tel" },
  { key: "address",    label: "住所",            wide: true },
  { key: "website",    label: "Webサイト",       type: "url", wide: true },
  { key: "memo",       label: "備考",            wide: true },
];

export default function OcrConfirmForm({
  imagePreviewUrl,
  rawText,
  originalImageUrl,
  initial,
  templates,
  onBack,
}: Props) {
  const router = useRouter();

  const [values, setValues] = useState<EditableFields>({
    name:       initial.name,
    company:    initial.company,
    department: initial.department,
    position:   initial.position,
    email:      initial.email,
    phone:      initial.phone,
    address:    initial.address,
    website:    initial.website,
    memo:       "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultTemplate = templates.find((t) => t.is_default) ?? templates[0] ?? null;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    defaultTemplate?.id ?? null
  );

  const emailEmpty = !values.email.trim();
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  const vars = {
    name:       values.name,
    company:    values.company,
    department: values.department,
    position:   values.position,
    email:      values.email,
    sender_name: null,
  };
  const previewSubject = selectedTemplate
    ? renderTemplate(selectedTemplate.subject_template, vars)
    : "";
  const previewBody = selectedTemplate
    ? renderTemplate(selectedTemplate.body_template, vars)
    : "";

  function set(key: keyof EditableFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSaveOnly() {
    setError(null);
    setLoading(true);
    const result = await createCard({
      ...values,
      raw_ocr_text: rawText,
      original_image_url: originalImageUrl,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // createCard は成功時に redirect("/cards") するのでここには戻らない
  }

  async function handleSaveAndOpenMail() {
    if (!selectedTemplate || !values.email.trim()) return;
    setError(null);
    setLoading(true);

    const result = await saveCardAndReturn({
      ...values,
      raw_ocr_text: rawText,
      original_image_url: originalImageUrl,
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // mailto リンクでデフォルトメールアプリを開く
    const mailto =
      "mailto:" + encodeURIComponent(values.email) +
      "?subject=" + encodeURIComponent(previewSubject) +
      "&body=" + encodeURIComponent(previewBody);

    window.location.href = mailto;

    // 少し待ってから名刺一覧へ遷移
    setTimeout(() => router.push("/cards"), 500);
  }

  const canSend = !!selectedTemplate && !emailEmpty;

  return (
    <div style={s.root}>
      <div style={s.layout}>
        {/* 左カラム: 画像 + フォーム */}
        <div style={s.leftCol}>
          {imagePreviewUrl && (
            <div style={s.imagePane}>
              <p style={s.sectionLabel}>名刺画像</p>
              <img src={imagePreviewUrl} alt="名刺" style={s.image} />
            </div>
          )}

          <div style={s.formCard}>
            {emailEmpty && (
              <div style={s.warning} role="alert">
                ⚠ メールアドレスが読み取れませんでした。手動で入力してください。
              </div>
            )}
            <div className="grid-2col" style={s.grid}>
              {FIELDS.map(({ key, label, type, wide }) => (
                <div key={key} style={wide ? s.fullCol : s.halfCol}>
                  <label style={s.label}>
                    {label}
                    {key === "email" && <span style={s.required}> *</span>}
                  </label>
                  {key === "memo" ? (
                    <textarea
                      value={values[key]}
                      onChange={set(key)}
                      rows={2}
                      style={s.textarea}
                    />
                  ) : (
                    <input
                      type={type ?? "text"}
                      value={values[key]}
                      onChange={set(key)}
                      style={{
                        ...s.input,
                        ...(key === "email" && emailEmpty ? s.inputWarn : {}),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右カラム: テンプレート選択 + プレビュー */}
        <div style={s.rightCol}>
          <div style={s.templateCard}>
            <p style={s.sectionLabel}>テンプレートを選ぶ</p>

            <div style={s.tmplList}>
              {templates.map((t) => (
                <label
                  key={t.id}
                  style={{
                    ...s.tmplRow,
                    ...(selectedTemplateId === t.id ? s.tmplRowSelected : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="ocr-template"
                    checked={selectedTemplateId === t.id}
                    onChange={() => setSelectedTemplateId(t.id)}
                    style={s.radio}
                  />
                  <div style={s.tmplInfo}>
                    <span style={s.tmplName}>{t.name}</span>
                    {t.is_default && <span style={s.badge}>デフォルト</span>}
                  </div>
                </label>
              ))}
              <label
                style={{
                  ...s.tmplRow,
                  ...(selectedTemplateId === null ? s.tmplRowSelected : {}),
                }}
              >
                <input
                  type="radio"
                  name="ocr-template"
                  checked={selectedTemplateId === null}
                  onChange={() => setSelectedTemplateId(null)}
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
                  <span style={s.previewSubjectTag}>件名</span>
                  <span style={s.previewSubjectText}>
                    {previewSubject || <em style={{ color: "#94a3b8" }}>（未設定）</em>}
                  </span>
                </div>
                <div style={s.previewBodyWrap}>
                  <span style={s.previewBodyTag}>本文</span>
                  <pre style={s.previewBody}>{previewBody || "（未設定）"}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {/* アクションボタン */}
      <div style={s.actions}>
        <button type="button" onClick={onBack} style={s.backBtn} disabled={loading}>
          ← 撮り直す
        </button>
        <div style={s.actionRight}>
          {selectedTemplateId !== null && (
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={loading}
              style={s.saveOnlyBtn}
            >
              保存のみ
            </button>
          )}
          <button
            type="button"
            onClick={selectedTemplateId ? handleSaveAndOpenMail : handleSaveOnly}
            disabled={loading || (selectedTemplateId !== null && !canSend)}
            style={{
              ...s.mainBtn,
              ...(selectedTemplateId !== null && !canSend ? s.mainBtnDisabled : {}),
            }}
          >
            {loading
              ? "処理中..."
              : selectedTemplateId
              ? "保存してメールアプリを開く →"
              : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: "1.25rem" },

  layout: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: "1 1 360px",
    minWidth: 0,
  },

  rightCol: {
    flex: "1 1 320px",
    minWidth: 0,
  },

  imagePane: { marginBottom: "0.25rem" },
  sectionLabel: {
    fontSize: "0.8125rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "0.5rem",
  },
  image: {
    width: "100%",
    maxHeight: 220,
    objectFit: "contain",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },

  formCard: {
    background: "#fff",
    borderRadius: 8,
    padding: "1.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },

  warning: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    borderRadius: 4,
    padding: "0.5rem 0.75rem",
    fontSize: "0.8125rem",
    marginBottom: "1rem",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem 1rem",
  },
  halfCol: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  fullCol: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    gridColumn: "1 / -1",
  },
  label: { fontSize: "0.75rem", fontWeight: 600, color: "#374151" },
  required: { color: "#dc2626" },
  input: {
    padding: "0.4rem 0.6rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9rem",
  },
  inputWarn: { borderColor: "#fcd34d", background: "#fffbeb" },
  textarea: {
    padding: "0.4rem 0.6rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9rem",
    resize: "vertical",
  },

  // テンプレートカード
  templateCard: {
    background: "#fff",
    borderRadius: 8,
    padding: "1.25rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    position: "sticky",
    top: 72,
  },

  tmplList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    marginBottom: "1rem",
  },
  tmplRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    cursor: "pointer",
    background: "#f8fafc",
    transition: "border-color 0.1s",
  },
  tmplRowSelected: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
  },
  radio: { flexShrink: 0, cursor: "pointer" },
  tmplInfo: { display: "flex", alignItems: "center", gap: "0.375rem", flex: 1 },
  tmplName: { fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" },
  badge: {
    padding: "0.1rem 0.4rem",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  tmplNone: { fontSize: "0.875rem", color: "#64748b" },

  // プレビュー
  preview: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: "0.875rem",
  },
  previewLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "0.625rem",
  },
  previewSubject: {
    display: "flex",
    alignItems: "baseline",
    gap: "0.5rem",
    marginBottom: "0.625rem",
  },
  previewSubjectTag: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94a3b8",
    flexShrink: 0,
    background: "#e2e8f0",
    borderRadius: 3,
    padding: "0.1rem 0.35rem",
  },
  previewSubjectText: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#1e293b",
    wordBreak: "break-all",
  },
  previewBodyWrap: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-start",
  },
  previewBodyTag: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94a3b8",
    flexShrink: 0,
    background: "#e2e8f0",
    borderRadius: 3,
    padding: "0.1rem 0.35rem",
    marginTop: 2,
  },
  previewBody: {
    fontSize: "0.8125rem",
    color: "#475569",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
    fontFamily: "inherit",
    lineHeight: 1.7,
    maxHeight: 240,
    overflowY: "auto",
  },

  error: { color: "#dc2626", fontSize: "0.875rem" },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "0.5rem",
  },
  actionRight: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  backBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.875rem",
    color: "#374151",
    cursor: "pointer",
  },
  saveOnlyBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.875rem",
    color: "#374151",
    cursor: "pointer",
  },
  mainBtn: {
    padding: "0.5rem 1.5rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  mainBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
};
