"use client";

import { useMemo, useState } from "react";
import type { SendJob } from "@/types/database";
import { JobDetailModal } from "./JobDetailModal";

type Filter = "all" | "pending" | "sent" | "failed";

interface Props {
  jobs: SendJob[];
  initialFilter: Filter;
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
  if (!iso) return "";
  return new Date(iso).toLocaleString("ja-JP", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function JobsClient({ jobs, initialFilter }: Props) {
  const [filter, setFilter]           = useState<Filter>(initialFilter);
  const [selectedJob, setSelectedJob] = useState<SendJob | null>(null);

  // ステータスグループ別カウント
  const counts = useMemo(() => ({
    all:     jobs.length,
    pending: jobs.filter((j) => ["pending", "processing"].includes(j.status)).length,
    sent:    jobs.filter((j) => j.status === "sent").length,
    failed:  jobs.filter((j) => ["failed", "canceled"].includes(j.status)).length,
  }), [jobs]);

  // フィルター後リスト
  const visible = useMemo(() => {
    if (filter === "pending") return jobs.filter((j) => ["pending", "processing"].includes(j.status));
    if (filter === "sent")    return jobs.filter((j) => j.status === "sent");
    if (filter === "failed")  return jobs.filter((j) => ["failed", "canceled"].includes(j.status));
    return jobs;
  }, [jobs, filter]);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all",     label: "すべて" },
    { key: "pending", label: "予約済み" },
    { key: "sent",    label: "送信済み" },
    { key: "failed",  label: "失敗・キャンセル" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          送信履歴・送信予定
        </h1>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          {jobs.length} 件
        </span>
      </div>

      {/* ─── フィルタータブ ─── */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "0.4rem",
                padding:      "0.375rem 0.875rem",
                borderRadius: 6,
                border:       active ? "1px solid #1e3a5f" : "1px solid #cbd5e1",
                background:   active ? "#1e3a5f" : "#fff",
                color:        active ? "#fff" : "#64748b",
                fontSize:     "0.875rem",
                cursor:       "pointer",
                fontWeight:   active ? 600 : 400,
                transition:   "all 0.1s",
              }}
            >
              {t.label}
              <span style={{
                padding:      "0 0.4rem",
                borderRadius: 9999,
                fontSize:     "0.7rem",
                background:   active ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                color:        active ? "#fff" : "#64748b",
                fontWeight:   600,
                minWidth:     "1.2rem",
                textAlign:    "center",
              }}>
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── ジョブ一覧 ─── */}
      {visible.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem 1rem",
          color: "#94a3b8", fontSize: "0.875rem",
          border: "1px dashed #e2e8f0", borderRadius: 8,
        }}>
          該当するジョブがありません
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {visible.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onClick={() => setSelectedJob(job)}
            />
          ))}
        </div>
      )}

      {/* ─── 詳細モーダル ─── */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}

// ─── 行コンポーネント ────────────────────────────────────────────
function JobRow({ job, onClick }: { job: SendJob; onClick: () => void }) {
  const isScheduled   = job.mode === "scheduled";
  const dateLabel     = isScheduled
    ? (job.status === "sent" ? `送信済 ${fmt(job.sent_at)}` : `予約 ${fmt(job.scheduled_at)}`)
    : `即時 ${fmt(job.created_at)}`;

  return (
    <div
      onClick={onClick}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "0.75rem",
        padding:      "0.75rem 1rem",
        border:       "1px solid #e2e8f0",
        borderRadius: 8,
        background:   "#fff",
        cursor:       "pointer",
        transition:   "box-shadow 0.1s, border-color 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow   = "0 2px 8px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#94a3b8";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow   = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
      }}
    >
      {/* ステータスバー */}
      <div style={{
        width: 4, alignSelf: "stretch", borderRadius: 2, flexShrink: 0,
        background: (STATUS_COLOR[job.status]?.background as string) ?? "#e2e8f0",
      }} />

      {/* メイン情報 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: "0.875rem",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: "#1e293b",
        }}>
          {job.subject}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace" }}>
            {job.to_email}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {dateLabel}
          </span>
          {job.retry_count > 0 && (
            <span style={{ fontSize: "0.72rem", color: "#f59e0b" }}>
              リトライ {job.retry_count}回
            </span>
          )}
        </div>
        {job.error_message && (
          <div style={{
            fontSize: "0.72rem", color: "#dc2626", marginTop: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {job.error_message}
          </div>
        )}
      </div>

      {/* 右: バッジ群 */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
        <span style={{
          padding:      "0.15rem 0.5rem",
          borderRadius: 9999,
          fontSize:     "0.7rem",
          fontWeight:   500,
          background:   "#f1f5f9",
          color:        "#64748b",
        }}>
          {isScheduled ? "予約" : "即時"}
        </span>
        <span style={{
          padding:      "0.2rem 0.6rem",
          borderRadius: 9999,
          fontSize:     "0.75rem",
          fontWeight:   600,
          ...(STATUS_COLOR[job.status] ?? {}),
        }}>
          {STATUS_LABEL[job.status] ?? job.status}
        </span>
        <span style={{ color: "#cbd5e1", fontSize: "0.875rem" }}>›</span>
      </div>
    </div>
  );
}
