"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/cards",     label: "名刺一覧",   icon: "🗂" },
  { href: "/cards/new", label: "名刺追加",   icon: "➕" },
  { href: "/templates", label: "テンプレート", icon: "📝" },
  { href: "/send",      label: "送信",       icon: "✉" },
];

type Props = { email: string };

export default function NavBar({ email }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function isActive(href: string) {
    if (href === "/cards") return pathname === "/cards";
    return pathname.startsWith(href);
  }

  return (
    <nav style={s.nav} ref={menuRef}>
      {/* ロゴ */}
      <Link href="/cards/new" style={s.logo}>
        <span style={s.logoIcon}>🪪</span>
        <span style={s.logoText}>名刺アプリ</span>
      </Link>

      {/* デスクトップ: リンク */}
      <div className="nav-desktop" style={s.links}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link-fx"
            style={{ ...s.link, ...(isActive(item.href) ? s.linkActive : {}) }}
          >
            {item.label}
            {isActive(item.href) && <span style={s.linkDot} />}
          </Link>
        ))}
      </div>

      {/* デスクトップ: ユーザー */}
      <div className="nav-desktop" style={s.userArea}>
        <span className="nav-email" style={s.email}>{email}</span>
        <LogoutButton />
      </div>

      {/* モバイル: ハンバーガー */}
      <button
        className="nav-mobile btn"
        type="button"
        onClick={() => setOpen(o => !o)}
        style={s.hamburger}
        aria-label="メニュー"
      >
        <span style={{ ...s.bar, ...(open ? s.barTop : {}) }} />
        <span style={{ ...s.bar, ...(open ? s.barMid : {}) }} />
        <span style={{ ...s.bar, ...(open ? s.barBot : {}) }} />
      </button>

      {/* モバイル: ドロップダウン */}
      {open && (
        <div style={s.dropdown} className="dropdown-anim">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{ ...s.dropItem, ...(isActive(item.href) ? s.dropItemActive : {}) }}
            >
              <span style={s.dropIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <div style={s.dropDivider} />
          <div style={s.dropFooter}>
            <span style={s.dropEmail}>{email}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </nav>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0 1.25rem",
    height: 56,
    background: "linear-gradient(135deg, #0f2744 0%, #1e3a5f 60%, #1e40af 100%)",
    color: "#fff",
    flexShrink: 0,
    zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginRight: "1rem",
    flexShrink: 0,
    color: "#fff",
  },
  logoIcon: { fontSize: "1.25rem" },
  logoText: { fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.01em" },

  links: { alignItems: "center", gap: "0.125rem", flex: 1 },
  link: {
    color: "rgba(255,255,255,0.72)",
    padding: "0.3rem 0.75rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  linkActive: { color: "#fff", fontWeight: 700 },
  linkDot: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    transform: "translateX(-50%)",
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "#60a5fa",
  },

  userArea: { alignItems: "center", gap: "0.75rem", marginLeft: "auto", flexShrink: 0 },
  email: { fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" },

  hamburger: {
    flexDirection: "column",
    gap: 5,
    background: "none",
    border: "none",
    padding: 8,
    borderRadius: 6,
    marginLeft: "auto",
    cursor: "pointer",
  },
  bar: {
    display: "block",
    width: 22,
    height: 2,
    background: "#fff",
    borderRadius: 2,
    transition: "transform 0.22s ease, opacity 0.22s ease",
  },
  barTop: { transform: "translateY(7px) rotate(45deg)" },
  barMid: { opacity: 0 },
  barBot: { transform: "translateY(-7px) rotate(-45deg)" },

  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    background: "linear-gradient(180deg, #0f2744 0%, #1e3a5f 100%)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    color: "rgba(255,255,255,0.78)",
    padding: "0.875rem 1.25rem",
    fontSize: "1rem",
    fontWeight: 500,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s, color 0.15s",
  },
  dropItemActive: { color: "#fff", background: "rgba(255,255,255,0.1)", fontWeight: 700 },
  dropIcon: { fontSize: "1.1rem" },
  dropDivider: { height: 1, background: "rgba(255,255,255,0.12)", margin: "0.25rem 0" },
  dropFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem" },
  dropEmail: { fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)" },
};
