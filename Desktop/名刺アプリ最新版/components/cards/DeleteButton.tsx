"use client";

import { useState } from "react";
import { deleteCard } from "@/lib/actions/cards";

export default function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("この名刺を削除しますか？この操作は取り消せません。")) return;
    setLoading(true);
    await deleteCard(id);
    // 成功時は server action 側で /cards へ redirect
    setLoading(false);
  }

  return (
    <button onClick={handleClick} disabled={loading} style={s.btn}>
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
