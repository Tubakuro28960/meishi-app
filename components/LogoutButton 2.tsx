"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} style={styles.button}>
      ログアウト
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    background: "transparent",
    border: "1px solid #475569",
    color: "#cbd5e1",
    padding: "0.25rem 0.75rem",
    borderRadius: 4,
    fontSize: "0.75rem",
    cursor: "pointer",
  },
};
