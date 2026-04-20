"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SendJob, SendLog } from "@/types/database";
import { RetryButton }     from "./RetryButton";
import { CancelJobButton } from "./CancelJobButton";

interface Props {
  job: SendJob;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending:    "予約済み",
  processing: "処理中",
  sent:       "送信済み",
  failed:     "失敗",
  canceled:   "キャンセル",
};

const STATUS_COLOR: Record<string, React.CSSProperties> = {
  pending:    { color: "#d97706", background: "#fef3c7" },
  processing: { color: "#2563eb", background: "#dbeafe" },
  sent:       { color: "#16a34a", background: "#dcfce7" },
  failed:     { color: "#dc2626", background: "#fee2e2" },
  canceled:   { color: "#64748b", background: "#f1f5f9" },
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function JobDetailModal({ job, onClose }: Props) {
  const [logs, setLogs]             = useState<SendLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // send_logs をフェッチ
  useEffect(() => {
    setLogsLoading(true);
    const supabase = createClient();
    supabase
      .from("send_logs")
      .select("id, attempt_no, result, response_summary, created_at")
      .eq("send_job_id", job.id)
      .order("attempt_no", { ascending: true })
      .then(({ data }) => {
        setLogs((data ?? []) as SendLog[]);
        setLogsLoading(false);
      });
  }, [job.id]);

  // ESC で閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // 背景スクロールロック
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* ─── ヘッダー ─── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
              ジョブ詳細
            </h2>
            <span style={{
              padding: "0.2rem 0.6rem", borderRadius: 9999,
              fontSize: "0.75rem", fontWeight: 600,
              ...(STATUS_COLOR[job.status] ?? {}),
            }}>
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
            <span style={{
              padding: "0.2rem 0.6rem", borderRadius: 9999,
              fontSize: "0.7rem", fontWeight: 500,
              background: "#f1f5f9", color: "#475569",
            }}>
              {job.mode === "scheduled" ? "予約送信" : "即時送信"}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none",
            cursor: "pointer", fontSize: "1.25rem", color: "#94a3b8",
            lineHeight: 1, padding: "0.25rem",
          }}>
            ✕
          </button>
        </div>

        {/* ─── スクロール可能な本体 ─── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem" }}>

          {/* 送信先情報 */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={sectionHeading}>送信先情報</h3>
            <dl style={dlStyle}>
              <Row label="宛先"   value={job.to_email} mono />
              <Row label="件名"   value={job.subject} />
              <Row label="予定日時" value={fmt(job.scheduled_at)} />
              <Row label="送信日時" value={fmt(job.sent_at)} />
              {job.retry_count > 0 && (
                <Row label="リトライ" value={`${job.retry_count} 回`} />
              )}
              {job.error_message && (
                <Row label="エラー" value={job.error_message} error />
              )}
            </dl>
          </section>

          {/* 本文プレビュー */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={sectionHeading}>本文</h3>
            <pre style={{
              margin: 0,
              padding: "0.75rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "0.8rem",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#334155",
              maxHeight: 220,
              overflowY: "auto",
            }}>
              {job.body}
            </pre>
          </section>

          {/* 試行ログ */}
          <section>
            <h3 style={sectionHeading}>試行ログ</h3>
            {logsLoading ? (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>読み込み中…</p>
            ) : logs.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ログなし</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["試行", "結果", "概要", "日時"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>{log.attempt_no}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "0.15rem 0.5rem", borderRadius: 9999,
                            fontSize: "0.7rem", fontWeight: 600,
                            ...(log.result === "success"
                              ? { color: "#16a34a", background: "#dcfce7" }
                              : { color: "#dc2626", background: "#fee2e2" }),
                          }}>
                            {log.result === "success" ? "成功" : "失敗"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 220, wordBreak: "break-all", color: "#64748b" }}>
                          {log.response_summary ?? "—"}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#94a3b8" }}>
                          {fmt(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ─── フッター: アクション ─── */}
        <div style={{
          display: "flex", gap: "0.75rem", alignItems: "center",
          padding: "1rem 1.25rem",
          borderTop: "1px solid #e2e8f0",
          flexShrink: 0,
        }}>
          {job.status === "failed" && (
            <RetryButton jobId={job.id} onSuccess={onClose} />
          )}
          {(job.status === "pending" || job.status === "failed") && (
            <CancelJobButton jobId={job.id} onSuccess={onClose} />
          )}
          <button onClick={onClose} style={{
            marginLeft: "auto",
            padding: "0.375rem 1rem",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 小コンポーネント ───────────────────────────────────────────
function Row({
  label, value, mono = false, error = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  error?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", padding: "0.35rem 0", alignItems: "flex-start" }}>
      <dt style={{ width: 72, flexShrink: 0, fontSize: "0.75rem", color: "#94a3b8", paddingTop: 1 }}>
        {label}
      </dt>
      <dd style={{
        margin: 0, flex: 1,
        fontSize: "0.85rem",
        fontFamily: mono ? "monospace" : undefined,
        color: error ? "#dc2626" : "#1e293b",
        wordBreak: "break-all",
      }}>
        {value || "—"}
      </dd>
    </div>
  );
}

// ─── スタイル定数 ───────────────────────────────────────────────
const sectionHeading: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.5rem",
};

const dlStyle: React.CSSProperties = {
  margin: 0,
  padding: "0.5rem 0.75rem",
  background: "#f8fafc",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.4rem 0.6rem",
  fontWeight: 600,
  color: "#64748b",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0.4rem 0.6rem",
  verticalAlign: "top",
};
