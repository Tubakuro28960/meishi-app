"use client";

import { useState } from "react";
import { retryJob } from "@/lib/actions/jobs";

interface Props {
  jobId: string;
  onSuccess?: () => void;
}

export function RetryButton({ jobId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const res = await retryJob(jobId);
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
        {loading ? "処理中…" : "再送"}
      </button>
      {error && <span style={{ color: "#ef4444", fontSize: "0.75rem", marginLeft: 6 }}>{error}</span>}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  padding:      "0.25rem 0.75rem",
  borderRadius: 4,
  border:       "1px solid #3b82f6",
  background:   "#eff6ff",
  color:        "#1d4ed8",
  cursor:       "pointer",
  fontSize:     "0.8rem",
};
