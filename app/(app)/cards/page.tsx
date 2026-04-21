import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/cards/DeleteButton";
import type { BusinessCard } from "@/types/database";

export default async function CardsPage() {
  const supabase = await createClient();
  const { data: cards, error } = await supabase
    .from("business_cards")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>名刺一覧</h1>
        <Link href="/cards/new" style={s.addBtn}>+ 名刺を追加</Link>
      </div>

      {error && <p style={s.errorMsg}>{error.message}</p>}

      {!cards || cards.length === 0 ? (
        <div style={s.empty}>
          <p>まだ名刺が登録されていません。</p>
          <Link href="/cards/new" style={s.emptyLink}>最初の名刺を追加する</Link>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["氏名", "会社名", "部署", "メールアドレス", "登録日", ""].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cards as BusinessCard[]).map((card) => (
                <tr key={card.id} style={s.tr}>
                  <td style={s.td}>{card.name ?? "—"}</td>
                  <td style={s.td}>{card.company ?? "—"}</td>
                  <td style={s.td}>{card.department ?? "—"}</td>
                  <td style={s.td}>{card.email ?? "—"}</td>
                  <td style={{ ...s.td, ...s.dateCell }}>
                    {new Date(card.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td style={{ ...s.td, ...s.actionCell }}>
                    <Link href={`/cards/${card.id}`} style={s.detailBtn}>詳細</Link>
                    <Link href={`/cards/${card.id}/edit`} style={s.editBtn}>編集</Link>
                    <DeleteButton id={card.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  addBtn: { background: "#2563eb", color: "#fff", padding: "0.5rem 1rem", borderRadius: 4, fontSize: "0.875rem" },
  errorMsg: { color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
  empty: { background: "#fff", borderRadius: 8, padding: "3rem", textAlign: "center", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  emptyLink: { display: "inline-block", marginTop: "1rem", color: "#2563eb", textDecoration: "underline" },
  tableWrap: { background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.75rem 1rem", fontSize: "0.9375rem", color: "#1e293b", verticalAlign: "middle" },
  dateCell: { fontSize: "0.8125rem", color: "#64748b", whiteSpace: "nowrap" },
  actionCell: { whiteSpace: "nowrap", display: "flex", gap: "0.5rem", alignItems: "center" },
  detailBtn: { padding: "0.25rem 0.75rem", background: "#f1f5f9", color: "#1e3a5f", borderRadius: 4, fontSize: "0.8125rem" },
  editBtn: { padding: "0.25rem 0.75rem", background: "#eff6ff", color: "#2563eb", borderRadius: 4, fontSize: "0.8125rem" },
};
