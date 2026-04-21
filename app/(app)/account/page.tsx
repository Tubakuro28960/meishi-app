import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PasswordChangeForm from "@/components/account/PasswordChangeForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        アカウント
      </h1>
      <PasswordChangeForm email={user.email ?? ""} />
    </div>
  );
}
