import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/cards", label: "名刺一覧" },
  { href: "/cards/new", label: "名刺追加" },
  { href: "/templates", label: "テンプレート" },
  { href: "/send", label: "送信" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <span style={styles.logo}>名刺アプリ</span>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </div>
        <div style={styles.userArea}>
          <span style={styles.email}>{user.email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0 1.5rem",
    height: 56,
    background: "#1e3a5f",
    color: "#fff",
    flexShrink: 0,
  },
  logo: {
    fontWeight: 700,
    fontSize: "1rem",
    marginRight: "1rem",
    whiteSpace: "nowrap",
  },
  navLinks: {
    display: "flex",
    gap: "0.25rem",
    flex: 1,
    flexWrap: "wrap",
  },
  navLink: {
    color: "#cbd5e1",
    padding: "0.25rem 0.75rem",
    borderRadius: 4,
    fontSize: "0.875rem",
    transition: "background 0.15s",
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginLeft: "auto",
    flexShrink: 0,
  },
  email: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  main: {
    flex: 1,
    padding: "2rem 1.5rem",
    maxWidth: 1100,
    width: "100%",
    margin: "0 auto",
  },
};
