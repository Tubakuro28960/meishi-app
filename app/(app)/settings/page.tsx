import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>設定</h1>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>アカウント</h2>
        <p style={styles.email}>{user.email}</p>
        <LogoutButton />
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 600 },
  heading: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" },
  section: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sectionTitle: { fontSize: "1.125rem", fontWeight: 600, marginBottom: 0 },
  email: { color: "#475569", fontSize: "0.9375rem", margin: 0 },
};
