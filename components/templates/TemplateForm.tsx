"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  TEMPLATE_VARIABLES,
  PREVIEW_SAMPLE,
  SAMPLE_TEMPLATE,
  renderTemplate,
} from "@/lib/templates/render";
import type { TemplateFormValues } from "@/types/database";

type FocusedField = "subject" | "body" | null;

type Props = {
  action: (data: TemplateFormValues) => Promise<{ error: string } | void>;
  defaultValues?: Partial<TemplateFormValues>;
  cancelHref: string;
  submitLabel?: string;
};

const EMPTY: TemplateFormValues = {
  name: "",
  subject_template: "",
  body_template: "",
  is_default: false,
};

export default function TemplateForm({
  action,
  defaultValues,
  cancelHref,
  submitLabel = "保存",
}: Props) {
  const [values, setValues] = useState<TemplateFormValues>({
    ...EMPTY,
    ...defaultValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastFocused, setLastFocused] = useState<FocusedField>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function loadSample() {
    setValues((prev) => ({
      ...prev,
      name:             prev.name             || SAMPLE_TEMPLATE.name,
      subject_template: prev.subject_template || SAMPLE_TEMPLATE.subject_template,
      body_template:    prev.body_template    || SAMPLE_TEMPLATE.body_template,
    }));
  }

  // 変数チップクリック: フォーカス中フィールドのカーソル位置に挿入
  function insertVariable(variable: string) {
    const ref =
      lastFocused === "subject"
        ? subjectRef.current
        : lastFocused === "body"
        ? bodyRef.current
        : null;

    if (!ref) {
      navigator.clipboard.writeText(variable).catch(() => {});
      setCopied(variable);
      setTimeout(() => setCopied(null), 1500);
      return;
    }

    const start = ref.selectionStart ?? ref.value.length;
    const end   = ref.selectionEnd   ?? ref.value.length;
    const newVal = ref.value.slice(0, start) + variable + ref.value.slice(end);

    if (lastFocused === "subject") {
      setValues((prev) => ({ ...prev, subject_template: newVal }));
    } else {
      setValues((prev) => ({ ...prev, body_template: newVal }));
    }

    // レンダリング後にカーソルを復元
    requestAnimationFrame(() => {
      ref.setSelectionRange(start + variable.length, start + variable.length);
      ref.focus();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("テンプレート名を入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await action(values);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const previewSubject = renderTemplate(values.subject_template, PREVIEW_SAMPLE);
  const previewBody    = renderTemplate(values.body_template,    PREVIEW_SAMPLE);

  return (
    <form onSubmit={handleSubmit}>
      {/* テンプレート名 */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <label style={s.label}>
            テンプレート名 <span style={s.required}>*</span>
          </label>
          <button type="button" onClick={loadSample} style={s.sampleBtn}>
            サンプルを読み込む
          </button>
        </div>
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
          placeholder="例：名刺交換後のご挨拶"
          style={s.input}
          required
        />
      </div>

      {/* 差し込み変数 */}
      <div style={s.section}>
        <p style={s.varLabel}>
          差し込み変数{" "}
          <span style={s.varHint}>
            — 件名・本文にフォーカスしてからクリックすると挿入
            {!lastFocused && "（フォーカスがない場合はコピー）"}
          </span>
        </p>
        <div style={s.chips}>
          {TEMPLATE_VARIABLES.map(({ key, label, example }) => (
            <button
              key={key}
              type="button"
              title={`例: ${example}`}
              onClick={() => insertVariable(key)}
              style={{
                ...s.chip,
                ...(copied === key ? s.chipCopied : {}),
              }}
            >
              {copied === key ? "コピー完了" : `${key} (${label})`}
            </button>
          ))}
        </div>
      </div>

      {/* 件名テンプレート */}
      <div style={s.section}>
        <label style={s.label}>件名テンプレート</label>
        <input
          ref={subjectRef}
          type="text"
          value={values.subject_template}
          onChange={(e) =>
            setValues((p) => ({ ...p, subject_template: e.target.value }))
          }
          onFocus={() => setLastFocused("subject")}
          placeholder="例：{{company}} {{name}}様 - 名刺交換のお礼"
          style={s.input}
        />
      </div>

      {/* 本文テンプレート */}
      <div style={s.section}>
        <label style={s.label}>本文テンプレート</label>
        <textarea
          ref={bodyRef}
          value={values.body_template}
          onChange={(e) =>
            setValues((p) => ({ ...p, body_template: e.target.value }))
          }
          onFocus={() => setLastFocused("body")}
          rows={10}
          placeholder={"{{name}}様\n\n先日はお名刺を交換いただき..."}
          style={s.textarea}
        />
      </div>

      {/* デフォルト設定 */}
      <div style={s.checkRow}>
        <label style={s.checkLabel}>
          <input
            type="checkbox"
            checked={values.is_default}
            onChange={(e) =>
              setValues((p) => ({ ...p, is_default: e.target.checked }))
            }
            style={s.checkbox}
          />
          デフォルトテンプレートに設定する
        </label>
        <span style={s.checkHint}>送信画面でデフォルト選択されます</span>
      </div>

      {/* プレビュー */}
      <div style={s.preview}>
        <p style={s.previewTitle}>プレビュー（サンプルデータで表示）</p>
        <div style={s.previewItem}>
          <span style={s.previewKey}>件名</span>
          <span style={s.previewValue}>
            {previewSubject || <span style={s.previewEmpty}>（未入力）</span>}
          </span>
        </div>
        <div style={s.previewItem}>
          <span style={{ ...s.previewKey, alignSelf: "flex-start" }}>本文</span>
          <pre style={s.previewBody}>
            {previewBody || <span style={s.previewEmpty}>（未入力）</span>}
          </pre>
        </div>
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.actions}>
        <Link href={cancelHref} style={s.cancelBtn}>キャンセル</Link>
        <button type="submit" disabled={loading} style={s.saveBtn}>
          {loading ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

const s: Record<string, React.CSSProperties> = {
  section:       { marginBottom: "1.25rem" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" },
  label:         { fontSize: "0.875rem", fontWeight: 600, color: "#374151" },
  required:      { color: "#dc2626" },
  sampleBtn:     { fontSize: "0.75rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 },
  input:         { width: "100%", padding: "0.5rem 0.625rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem", boxSizing: "border-box" },
  textarea:      { width: "100%", padding: "0.5rem 0.625rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" },
  varLabel:      { fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" },
  varHint:       { fontWeight: 400, color: "#94a3b8", fontSize: "0.8125rem" },
  chips:         { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  chip:          { padding: "0.25rem 0.625rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 20, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "monospace", transition: "background 0.1s" },
  chipCopied:    { background: "#dcfce7", color: "#166534", borderColor: "#86efac" },
  checkRow:      { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" },
  checkLabel:    { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.9375rem", cursor: "pointer" },
  checkbox:      { width: 16, height: 16, cursor: "pointer" },
  checkHint:     { fontSize: "0.8125rem", color: "#94a3b8" },
  preview:       { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "1rem", marginBottom: "1.25rem" },
  previewTitle:  { fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem" },
  previewItem:   { display: "flex", gap: "0.75rem", marginBottom: "0.5rem" },
  previewKey:    { fontSize: "0.8125rem", color: "#94a3b8", width: 40, flexShrink: 0, paddingTop: "0.125rem" },
  previewValue:  { fontSize: "0.9375rem", color: "#1e293b" },
  previewBody:   { fontSize: "0.9375rem", color: "#1e293b", whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, flex: 1 },
  previewEmpty:  { color: "#cbd5e1", fontStyle: "italic" },
  error:         { color: "#dc2626", fontSize: "0.875rem", marginBottom: "0.75rem" },
  actions:       { display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" },
  cancelBtn:     { padding: "0.5rem 1.25rem", border: "1px solid #d1d5db", borderRadius: 4, color: "#374151", fontSize: "0.9375rem", background: "#fff" },
  saveBtn:       { padding: "0.5rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer" },
};
