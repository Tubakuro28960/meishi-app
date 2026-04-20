import { createClient } from "@/lib/supabase/server";
import CardsNewClient from "@/components/cards/CardsNewClient";
import type { Template } from "@/types/database";

export default async function CardsNewPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, subject_template, body_template, is_default")
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  return <CardsNewClient templates={(templates ?? []) as Template[]} />;
}
