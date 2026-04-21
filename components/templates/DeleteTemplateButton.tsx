"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplate } from "@/lib/actions/templates";

type Props = { id: string; style?: React.CSSProperties };

export default function DeleteTemplateButton({ id, style }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("このテンプレートを削除しますか？この操作は取り消せません。")) return;
    setLoading(true);
    setError(null);
    const result = await deleteTemplate(id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/templates");
    router.refresh();
  }

  return (
    <span>
      <button onClick={handleClick} disabled={loading} style={{ ...s.btn, ...style }}>
        {loading ? "削除中..." : "削除"}
      </button>
      {error && <span style={s.error}>{error}</span>}
    </span>
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
  error: {
    fontSize: "0.75rem",
    color: "#dc2626",
    marginLeft: "0.5rem",
  },
};
