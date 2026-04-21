import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/cards/DeleteButton";
import type { BusinessCard } from "@/types/database";

type Props = { params: Promise<{ id: string }> };

const FIELD_LABELS: { key: keyof BusinessCard; label: string }[] = [
  { key: "company",    label: "会社名" },
  { key: "department", label: "部署" },
  { key: "position",   label: "役職" },
  { key: "email",      label: "メールアドレス" },
  { key: "phone",      label: "電話番号" },
  { key: "address",    label: "住所" },
  { key: "website",    label: "Webサイト" },
  { key: "memo",       label: "備考" },
];

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (!card) notFound();

  const c = card as BusinessCard;

  return (
    <div>
      <div style={s.header}>
        <div>
          <Link href="/cards" style={s.back}>← 一覧に戻る</Link>
          <h1 style={s.heading}>{c.name ?? "（氏名なし）"}</h1>
        </div>
        <div style={s.headerActions}>
          <Link href={`/cards/${id}/edit`} style={s.editBtn}>編集</Link>
          <DeleteButton id={id} />
        </div>
      </div>

      <div style={s.card}>
        <dl style={s.dl}>
          {FIELD_LABELS.map(({ key, label }) => {
            const value = c[key];
            if (!value) return null;
            return (
              <div key={key} style={s.row}>
                <dt style={s.dt}>{label}</dt>
                <dd style={s.dd}>
                  {key === "website" ? (
                    <a href={String(value)} target="_blank" rel="noopener noreferrer" style={s.link}>
                      {String(value)}
                    </a>
                  ) : key === "email" ? (
                    <a href={`mailto:${value}`} style={s.link}>{String(value)}</a>
                  ) : (
                    String(value)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        <div style={s.meta}>
          <span>登録日: {new Date(c.created_at).toLocaleDateString("ja-JP")}</span>
          <span>更新日: {new Date(c.updated_at).toLocaleDateString("ja-JP")}</span>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" },
  back: { fontSize: "0.875rem", color: "#64748b", display: "block", marginBottom: "0.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  headerActions: { display: "flex", gap: "0.75rem", alignItems: "center" },
  editBtn: { padding: "0.375rem 0.875rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 4, fontSize: "0.875rem" },
  card: { background: "#fff", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  dl: { display: "grid", gridTemplateColumns: "8rem 1fr", gap: "0.875rem 1rem" },
  row: { display: "contents" },
  dt: { fontSize: "0.8125rem", fontWeight: 600, color: "#64748b", alignSelf: "start", paddingTop: "0.125rem" },
  dd: { fontSize: "0.9375rem", color: "#1e293b", whiteSpace: "pre-wrap" },
  link: { color: "#2563eb", textDecoration: "underline" },
  meta: { display: "flex", gap: "1.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9", fontSize: "0.8125rem", color: "#94a3b8" },
};
