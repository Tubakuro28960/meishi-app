import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import GmailConnectButton from "@/components/GmailConnectButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: token } = await service
    .from("user_gmail_tokens")
    .select("gmail_email")
    .eq("user_id", user.id)
    .single();

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>設定</h1>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Gmail連携</h2>
        <p style={styles.description}>
          連携すると、メール送信があなたのGmailアドレスから行われます。
        </p>

        {token ? (
          <div style={styles.connected}>
            <span style={styles.badge}>連携済み</span>
            <span style={styles.gmailEmail}>{token.gmail_email}</span>
            <GmailConnectButton label="別のアカウントで再連携" />
          </div>
        ) : (
          <div style={styles.notConnected}>
            <p style={styles.warning}>
              未連携の場合はシステムの送信アドレスから送信されます。
            </p>
            <GmailConnectButton label="Gmailを連携する" />
          </div>
        )}
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
  },
  sectionTitle: { fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" },
  description: { color: "#475569", fontSize: "0.875rem", marginBottom: "1rem" },
  connected: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" },
  badge: {
    background: "#dcfce7",
    color: "#16a34a",
    borderRadius: 4,
    padding: "0.25rem 0.625rem",
    fontSize: "0.8125rem",
    fontWeight: 600,
  },
  gmailEmail: { fontSize: "0.9375rem", color: "#1e293b" },
  notConnected: {},
  warning: { color: "#64748b", fontSize: "0.875rem", marginBottom: "0.75rem" },
};
