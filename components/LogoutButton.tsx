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
    <button onClick={handleLogout} className="btn" style={s.btn}>
      ログアウト
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.8)",
    padding: "0.3rem 0.875rem",
    borderRadius: 6,
    fontSize: "0.75rem",
    cursor: "pointer",
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
};
