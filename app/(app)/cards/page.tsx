import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CardsClient from "@/components/cards/CardsClient";
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

      <CardsClient cards={(cards ?? []) as BusinessCard[]} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  addBtn: { background: "#2563eb", color: "#fff", padding: "0.5rem 1rem", borderRadius: 4, fontSize: "0.875rem" },
  errorMsg: { color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
};
