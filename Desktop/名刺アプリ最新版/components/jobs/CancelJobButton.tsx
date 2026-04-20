"use client";

import { useState } from "react";
import { cancelJob } from "@/lib/actions/jobs";

interface Props {
  jobId: string;
  onSuccess?: () => void;
}

export function CancelJobButton({ jobId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("このジョブをキャンセルしますか？")) return;
    setLoading(true);
    setError(null);
    const res = await cancelJob(jobId);
    if (res?.error) {
      setError(res.error);
    } else {
      onSuccess?.();
    }
    setLoading(false);
  }

  return (
    <span>
      <button onClick={handleClick} disabled={loading} style={btnStyle}>
        {loading ? "処理中…" : "キャンセル"}
      </button>
      {error && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginLeft: 6 }}>{error}</span>}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  padding:      "0.25rem 0.75rem",
  borderRadius: 4,
  border:       "1px solid #e2e8f0",
  background:   "#fff",
  color:        "#64748b",
  cursor:       "pointer",
  fontSize:     "0.8rem",
};
