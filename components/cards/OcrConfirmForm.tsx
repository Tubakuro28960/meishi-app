"use client";

import { useState } from "react";
import { createCard, createCardAndSend } from "@/lib/actions/cards";
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

const FIELDS: { key: keyof EditableFields; label: string; type?: string; wide?: boolean; required?: boolean }[] = [
  { key: "name",       label: "氏名",           required: false },
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス", type: "email", wide: true, required: true },
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

  // 送信オプション
  const defaultTemplate = templates.find((t) => t.is_default) ?? templates[0] ?? null;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    defaultTemplate?.id ?? null
  );
  const [sendTiming, setSendTiming] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledAt, setScheduledAt] = useState("");

  const emailEmpty = !values.email.trim();
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

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
  }

  async function handleSaveAndSend() {
    if (!selectedTemplate || !values.email.trim()) return;
    setError(null);
    setLoading(true);

    const vars = {
      name:        values.name,
      company:     values.company,
      department:  values.department,
      position:    values.position,
      email:       values.email,
      sender_name: null,
    };
    const subject = renderTemplate(selectedTemplate.subject_template, vars);
    const body    = renderTemplate(selectedTemplate.body_template, vars);

    if (sendTiming === "immediate") {
      // カード保存後にGmailの作成画面を開く
      const result = await createCard({
        ...values,
        raw_ocr_text: rawText,
        original_image_url: originalImageUrl,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const gmailUrl =
        "https://mail.google.com/mail/?view=cm&fs=1" +
        "&to=" + encodeURIComponent(values.email) +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.open(gmailUrl, "_blank");
    } else {
      // 予約送信はバックエンドで処理
      if (!scheduledAt) {
        setError("送信日時を指定してください");
        setLoading(false);
        return;
      }

      const result = await createCardAndSend(
        {
          ...values,
          raw_ocr_text: rawText,
          original_image_url: originalImageUrl,
        },
        {
          template_id: selectedTemplate.id,
          subject,
          body,
          timing: sendTiming,
          scheduled_at: scheduledAt,
        }
      );

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    }
  }

  const canSend = !!selectedTemplate && !emailEmpty;

  return (
    <div style={s.root}>
      <div style={s.layout}>
        {/* 画像プレビュー */}
        {imagePreviewUrl && (
          <div style={s.imagePane}>
            <p style={s.imageLabel}>名刺画像</p>
            <img src={imagePreviewUrl} alt="名刺" style={s.image} />
          </div>
        )}

        {/* フォーム */}
        <div style={s.formPane}>
          {emailEmpty && (
            <div style={s.warning} role="alert">
              ⚠ メールアドレスが読み取れませんでした。確認して手動で入力してください。
            </div>
          )}

          <div style={s.grid}>
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
                    rows={3}
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

          {/* 送信設定 */}
          <div style={s.sendSection}>
            <p style={s.sendTitle}>メール送信設定</p>

            {/* テンプレート選択 */}
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
                    <span style={s.tmplSubject}>件名: {t.subject_template || "（未設定）"}</span>
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

            {/* 送信タイミング */}
            {selectedTemplateId && (
              <div style={s.timingSection}>
                <span style={s.timingLabel}>送信タイミング:</span>
                {(["immediate", "scheduled"] as const).map((val) => (
                  <label key={val} style={s.timingOption}>
                    <input
                      type="radio"
                      name="ocr-timing"
                      checked={sendTiming === val}
                      onChange={() => setSendTiming(val)}
                    />
                    {val === "immediate" ? "即時送信" : "予約送信"}
                  </label>
                ))}
                {sendTiming === "scheduled" && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                    style={s.datetimeInput}
                  />
                )}
              </div>
            )}
          </div>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <button type="button" onClick={onBack} style={s.backBtn} disabled={loading}>
              ← 撮り直す
            </button>
            <button
              type="button"
              onClick={selectedTemplateId ? handleSaveAndSend : handleSaveOnly}
              disabled={
                loading ||
                (!!selectedTemplateId && (!canSend || (sendTiming === "scheduled" && !scheduledAt)))
              }
              style={{
                ...s.sendBtn,
                ...(selectedTemplateId && (!canSend || (sendTiming === "scheduled" && !scheduledAt))
                  ? s.sendBtnDisabled
                  : {}),
                ...(selectedTemplateId && sendTiming === "scheduled" ? s.sendBtnScheduled : {}),
                ...(!selectedTemplateId ? s.saveOnlyStyle : {}),
              }}
            >
              {loading
                ? "処理中..."
                : !selectedTemplateId
                ? "保存する"
                : sendTiming === "scheduled"
                ? "保存して予約送信"
                : "保存して即時送信"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {},
  layout: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  imagePane: {
    width: 240,
    flexShrink: 0,
  },
  imageLabel: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "0.5rem",
  },
  image: {
    width: "100%",
    borderRadius: 4,
    border: "1px solid #e2e8f0",
    objectFit: "contain",
  },
  formPane: {
    flex: 1,
    minWidth: 280,
    background: "#fff",
    borderRadius: 8,
    padding: "1.5rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  warning: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    borderRadius: 4,
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.875rem 1rem",
  },
  halfCol: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  fullCol: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    gridColumn: "1 / -1",
  },
  label: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151" },
  required: { color: "#dc2626" },
  input: {
    padding: "0.5rem 0.625rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9375rem",
  },
  inputWarn: {
    borderColor: "#fcd34d",
    background: "#fffbeb",
  },
  textarea: {
    padding: "0.5rem 0.625rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.9375rem",
    resize: "vertical",
  },

  // 送信オプション
  sendSection: {
    marginTop: "1.5rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid #f1f5f9",
  },
  sendTitle: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "0.75rem",
  },
  tmplList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    marginBottom: "0.75rem",
  },
  tmplRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.625rem",
    padding: "0.625rem 0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    cursor: "pointer",
    background: "#f8fafc",
  },
  tmplRowSelected: {
    border: "1px solid #93c5fd",
    background: "#eff6ff",
  },
  radio: { marginTop: 3, flexShrink: 0, cursor: "pointer" },
  tmplInfo: { display: "flex", flexDirection: "column", gap: "0.125rem", flex: 1 },
  tmplName: { fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" },
  badge: {
    display: "inline-block",
    padding: "0.1rem 0.4rem",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
    marginLeft: "0.375rem",
  },
  tmplSubject: { fontSize: "0.8rem", color: "#64748b" },
  tmplNone: { fontSize: "0.875rem", color: "#64748b" },

  timingSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.625rem 0.75rem",
    background: "#f8fafc",
    borderRadius: 4,
    flexWrap: "wrap",
  },
  timingLabel: { fontSize: "0.875rem", fontWeight: 600, color: "#374151", flexShrink: 0 },
  timingOption: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", cursor: "pointer" },
  datetimeInput: {
    padding: "0.375rem 0.625rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.875rem",
    color: "#1e293b",
  },

  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    marginTop: "0.75rem",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1.5rem",
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
  sendBtn: {
    padding: "0.5rem 1.5rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  sendBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  sendBtnScheduled: {
    background: "#7c3aed",
  },
  saveOnlyStyle: {
    background: "#475569",
  },
};
