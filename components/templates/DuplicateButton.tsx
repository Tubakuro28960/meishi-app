"use client";

import { useState } from "react";
import { duplicateTemplate } from "@/lib/actions/templates";

type Props = { id: string; style?: React.CSSProperties };

export default function DuplicateButton({ id, style }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await duplicateTemplate(id);
    setLoading(false);
  }

  return (
    <button onClick={handleClick} disabled={loading} style={{ ...s.btn, ...style }}>
      {loading ? "複製中..." : "複製"}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    padding: "0.375rem 0.875rem",
    background: "#fff",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
};
