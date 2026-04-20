"use client";

import { useState } from "react";
import { deleteTemplate } from "@/lib/actions/templates";

type Props = { id: string; style?: React.CSSProperties };

export default function DeleteTemplateButton({ id, style }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("このテンプレートを削除しますか？この操作は取り消せません。")) return;
    setLoading(true);
    await deleteTemplate(id);
    setLoading(false);
  }

  return (
    <button onClick={handleClick} disabled={loading} style={{ ...s.btn, ...style }}>
      {loading ? "削除中..." : "削除"}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    padding: "0.375rem 0.875rem",
    background: "#fff",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: 4,
    fontSize: "0.875rem",
    cursor: "pointer",
  },
};
