import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CardForm from "@/components/cards/CardForm";
import { updateCard } from "@/lib/actions/cards";
import type { BusinessCard } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function CardEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (!card) notFound();

  const c = card as BusinessCard;
  const boundUpdate = updateCard.bind(null, id);

  return (
    <div>
      <div style={s.header}>
        <Link href={`/cards/${id}`} style={s.back}>← 詳細に戻る</Link>
        <h1 style={s.heading}>{c.name ?? "（氏名なし）"} — 編集</h1>
      </div>
      <CardForm
        action={boundUpdate}
        cancelHref={`/cards/${id}`}
        submitLabel="更新する"
        defaultValues={{
          name:       c.name       ?? "",
          company:    c.company    ?? "",
          department: c.department ?? "",
          position:   c.position   ?? "",
          email:      c.email      ?? "",
          phone:      c.phone      ?? "",
          address:    c.address    ?? "",
          website:    c.website    ?? "",
          memo:       c.memo       ?? "",
        }}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { marginBottom: "1.5rem" },
  back: { fontSize: "0.875rem", color: "#64748b", display: "block", marginBottom: "0.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
};
