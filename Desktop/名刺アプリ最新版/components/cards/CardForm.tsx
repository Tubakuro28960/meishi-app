"use client";

import { useState } from "react";
import Link from "next/link";
import type { CardFormValues } from "@/types/database";

type Props = {
  action: (data: CardFormValues) => Promise<{ error: string } | void>;
  defaultValues?: Partial<CardFormValues>;
  cancelHref: string;
  submitLabel?: string;
};

const EMPTY: CardFormValues = {
  name: "",
  company: "",
  department: "",
  position: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  memo: "",
};

const FIELD_LABELS: { key: keyof CardFormValues; label: string; type?: string; wide?: boolean }[] = [
  { key: "name",       label: "氏名" },
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス", type: "email" },
  { key: "phone",      label: "電話番号",       type: "tel" },
  { key: "address",    label: "住所",            wide: true },
  { key: "website",    label: "Webサイト",       type: "url" },
  { key: "memo",       label: "備考",            wide: true },
];

export default function CardForm({
  action,
  defaultValues,
  cancelHref,
  submitLabel = "保存",
}: Props) {
  const [values, setValues] = useState<CardFormValues>({
    ...EMPTY,
    ...defaultValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(key: keyof CardFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await action(values);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // 成功時は server action 側で redirect するためここには戻らない
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      <div style={s.grid}>
        {FIELD_LABELS.map(({ key, label, type, wide }) => (
          <div key={key} style={wide ? s.fullCol : s.halfCol}>
            <label style={s.label}>{label}</label>
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
                style={s.input}
              />
            )}
          </div>
        ))}
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.actions}>
        <Link href={cancelHref} style={s.cancelBtn}>
          キャンセル
        </Link>
        <button type="submit" disabled={loading} style={s.submitBtn}>
          {loading ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { background: "#fff", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  halfCol: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  fullCol: { display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: "1 / -1" },
  label: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.5rem 0.625rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem" },
  textarea: { padding: "0.5rem 0.625rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem", resize: "vertical" },
  error: { color: "#dc2626", fontSize: "0.875rem", marginTop: "0.75rem" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" },
  cancelBtn: { padding: "0.5rem 1.25rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.9375rem", color: "#374151", background: "#fff" },
  submitBtn: { padding: "0.5rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 4, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer" },
};
