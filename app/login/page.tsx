"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerWithAllowedAccount } from "@/lib/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Supabase の英語エラーを日本語に変換
function toJapaneseError(message: string): string {
  if (message.includes("Invalid login credentials")) return "メールアドレスまたはパスワードが正しくありません";
  if (message.includes("Email not confirmed")) return "メールアドレスの確認が完了していません。確認メールをご確認ください";
  if (message.includes("User already registered")) return "このメールアドレスはすでに登録されています";
  if (message.includes("Password should be at least")) return "パスワードは6文字以上で設定してください";
  if (message.includes("Unable to validate email address")) return "メールアドレスの形式が正しくありません";
  if (message.includes("callback")) return "認証に失敗しました。再度お試しください";
  return message;
}

type Mode = "login" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "callback") {
      setError("認証に失敗しました。再度ログインしてください");
    }
  }, [searchParams]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "login") {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(toJapaneseError(error.message));
        setLoading(false);
        return;
      }
      router.push("/cards/new");
      router.refresh();
    } else {
      // 許可済みアカウントのみ登録可能
      const result = await registerWithAllowedAccount(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message);
      // 3秒後にログインタブへ自動切り替え
      setTimeout(() => switchMode("login"), 3000);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>名刺アプリ</h1>

        {/* タブ */}
        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
          >
            初回登録
          </button>
        </div>

        {mode === "signup" && (
          <p style={styles.notice}>
            ご利用には事前の許可が必要です。<br />
            管理者からお知らせされたメールアドレスと初期パスワードを入力してください。
          </p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="example@email.com"
            autoComplete="email"
          />

          <label style={styles.label}>
            {mode === "signup" ? "初期パスワード" : "パスワード"}
            {mode === "signup" && (
              <span style={styles.hint}>（管理者から通知されたもの）</span>
            )}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder={mode === "signup" ? "管理者から通知された初期パスワード" : "パスワード"}
            autoComplete={mode === "login" ? "current-password" : "current-password"}
          />

          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}
          {success && (
            <div style={styles.successBox} role="status">
              {success}
              <br />
              <span style={{ fontSize: "0.8125rem" }}>まもなくログイン画面に切り替わります…</span>
            </div>
          )}

          <button type="submit" disabled={loading || !!success} style={styles.button}>
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
          </button>
        </form>

        <p style={styles.switchNote}>
          {mode === "login" ? (
            <>初めてご利用の方は{" "}
              <button type="button" onClick={() => switchMode("signup")} style={styles.link}>
                初回登録
              </button>
            </>
          ) : (
            <>すでにアカウントをお持ちの方は{" "}
              <button type="button" onClick={() => switchMode("login")} style={styles.link}>
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4f8",
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: "2rem",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1.25rem",
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "1.5rem",
  },
  tab: {
    flex: 1,
    padding: "0.625rem",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: -2,
    cursor: "pointer",
    fontSize: "0.9375rem",
    color: "#64748b",
    fontWeight: 500,
  },
  tabActive: {
    borderBottom: "2px solid #2563eb",
    color: "#2563eb",
    fontWeight: 700,
  },
  notice: {
    fontSize: "0.8125rem",
    color: "#475569",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: "0.625rem 0.75rem",
    marginBottom: "1rem",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
  },
  hint: {
    fontWeight: 400,
    color: "#94a3b8",
    fontSize: "0.8125rem",
    marginLeft: "0.25rem",
  },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "1rem",
    marginBottom: "0.625rem",
    outline: "none",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 4,
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#16a34a",
    borderRadius: 4,
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
    lineHeight: 1.6,
  },
  button: {
    width: "100%",
    padding: "0.625rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.25rem",
  },
  switchNote: {
    textAlign: "center",
    marginTop: "1.25rem",
    fontSize: "0.875rem",
    color: "#64748b",
  },
  link: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "0.875rem",
    textDecoration: "underline",
    padding: 0,
  },
};
