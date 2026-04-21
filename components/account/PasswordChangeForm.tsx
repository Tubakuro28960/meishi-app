"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordChangeForm({ email }: { email: string }) {
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("パスワードが一致していません");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirm("");
  }

  return (
    <div style={s.wrap}>
      {/* アカウント情報 */}
      <div style={s.card}>
        <p style={s.sectionLabel}>アカウント</p>
        <p style={s.emailRow}>
          <span style={s.emailLabel}>メールアドレス</span>
          <span style={s.emailValue}>{email}</span>
        </p>
      </div>

      {/* パスワード変更 */}
      <div style={s.card}>
        <p style={s.sectionLabel}>パスワード変更</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="6文字以上"
              required
              className="input-fx"
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>新しいパスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirm(e.target.value)}
              placeholder="もう一度入力"
              required
              className="input-fx"
              style={s.input}
            />
          </div>

          {error && (
            <div style={s.errorBox} role="alert">{error}</div>
          )}
          {success && (
            <div style={s.successBox} role="status">
              ✅ パスワードを変更しました
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="btn btn-primary"
            style={s.submitBtn}
          >
            {loading ? "変更中..." : "パスワードを変更する"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
  },
  sectionLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.875rem",
  },

  emailRow:   { display: "flex", alignItems: "center", gap: "1rem" },
  emailLabel: { fontSize: "0.875rem", fontWeight: 600, color: "#64748b", flexShrink: 0 },
  emailValue: { fontSize: "0.9375rem", color: "#1e293b" },

  form:  { display: "flex", flexDirection: "column", gap: "0.875rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { fontSize: "0.8125rem", fontWeight: 600, color: "#374151" },
  input: {
    padding: "0.625rem 0.875rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: "1rem",
    background: "#fafafa",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 8,
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#16a34a",
    borderRadius: 8,
    padding: "0.625rem 0.875rem",
    fontSize: "0.875rem",
    fontWeight: 600,
  },

  submitBtn: {
    padding: "0.7rem 1.5rem",
    fontSize: "0.9375rem",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: "0.25rem",
  },
};
