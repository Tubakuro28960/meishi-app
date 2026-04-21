import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TemplatesClient from "@/components/templates/TemplatesClient";
import type { Template } from "@/types/database";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.heading}>テンプレート</h1>
        <Link href="/templates/new" style={s.addBtn}>+ 新規作成</Link>
      </div>
      {error && <p style={s.errorMsg}>{error.message}</p>}
      <TemplatesClient templates={(templates ?? []) as Template[]} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  heading:  { fontSize: "1.5rem", fontWeight: 700 },
  addBtn:   { background: "#2563eb", color: "#fff", padding: "0.5rem 1rem", borderRadius: 4, fontSize: "0.875rem" },
  errorMsg: { color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" },
};
