import { createClient } from "@/lib/supabase/server";
import SendWizard from "@/components/send/SendWizard";
import type { BusinessCard, Template } from "@/types/database";

export default async function SendPage() {
  const supabase = await createClient();

  const [cardsRes, templatesRes] = await Promise.all([
    supabase
      .from("business_cards")
      .select("id, name, company, department, position, email, status")
      .order("created_at", { ascending: false }),
    supabase
      .from("templates")
      .select("id, name, subject_template, body_template, is_default")
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>メール送信</h1>
        <p style={s.sub}>名刺を選んでテンプレートを適用し、メール作成画面を開きます。</p>
      </div>
      <SendWizard
        cards={(cardsRes.data ?? []) as BusinessCard[]}
        templates={(templatesRes.data ?? []) as Template[]}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:  { marginBottom: "1.5rem" },
  heading: { fontSize: "1.5rem", fontWeight: 700 },
  sub:     { color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" },
};
