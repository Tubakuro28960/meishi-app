"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/cards",     label: "名刺一覧" },
  { href: "/cards/new", label: "名刺追加" },
  { href: "/templates", label: "テンプレート" },
  { href: "/send",      label: "送信" },
];

type Props = { email: string };

export default function NavBar({ email }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // ページ遷移でメニューを閉じる
  useEffect(() => { setOpen(false); }, [pathname]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <nav style={s.nav} ref={menuRef}>
      {/* ロゴ */}
      <Link href="/cards" style={s.logo}>名刺アプリ</Link>

      {/* デスクトップ: 横並びリンク */}
      <div className="nav-desktop" style={s.desktopLinks}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              ...s.navLink,
              ...(pathname.startsWith(item.href) && item.href !== "/cards"
                ? s.navLinkActive
                : pathname === "/cards" && item.href === "/cards"
                ? s.navLinkActive
                : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* デスクトップ: ユーザーエリア */}
      <div className="nav-desktop" style={s.userArea}>
        <span className="nav-email" style={s.email}>{email}</span>
        <LogoutButton />
      </div>

      {/* モバイル: ハンバーガー */}
      <div className="nav-mobile" style={s.mobileRight}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={s.hamburger}
          aria-label="メニューを開く"
        >
          <span style={{ ...s.bar, ...(open ? s.barTop : {}) }} />
          <span style={{ ...s.bar, ...(open ? s.barMid : {}) }} />
          <span style={{ ...s.bar, ...(open ? s.barBot : {}) }} />
        </button>
      </div>

      {/* モバイル: ドロップダウンメニュー */}
      {open && (
        <div style={s.dropdown}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...s.dropItem,
                ...(pathname.startsWith(item.href) && item.href !== "/cards"
                  ? s.dropItemActive
                  : pathname === "/cards" && item.href === "/cards"
                  ? s.dropItemActive
                  : {}),
              }}
            >
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
    padding: "0 1rem",
    height: 52,
    background: "#1e3a5f",
    color: "#fff",
    flexShrink: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#fff",
    marginRight: "0.75rem",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  desktopLinks: {
    alignItems: "center",
    gap: "0.25rem",
    flex: 1,
  },
  navLink: {
    color: "#cbd5e1",
    padding: "0.3rem 0.75rem",
    borderRadius: 4,
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
  },
  navLinkActive: {
    color: "#fff",
    background: "rgba(255,255,255,0.15)",
  },
  userArea: {
    alignItems: "center",
    gap: "0.75rem",
    marginLeft: "auto",
    flexShrink: 0,
  },
  email: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },

  // ハンバーガー
  mobileRight: {
    alignItems: "center",
    marginLeft: "auto",
  },
  hamburger: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "5px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: 4,
  },
  bar: {
    display: "block",
    width: 22,
    height: 2,
    background: "#fff",
    borderRadius: 2,
    transition: "transform 0.2s, opacity 0.2s",
  },
  barTop: { transform: "translateY(7px) rotate(45deg)" },
  barMid: { opacity: 0 },
  barBot: { transform: "translateY(-7px) rotate(-45deg)" },

  // ドロップダウン
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    background: "#1e3a5f",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  dropItem: {
    color: "#cbd5e1",
    padding: "0.875rem 1.25rem",
    fontSize: "1rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  dropItemActive: {
    color: "#fff",
    background: "rgba(255,255,255,0.1)",
  },
  dropDivider: {
    borderTop: "1px solid rgba(255,255,255,0.15)",
    margin: "0.25rem 0",
  },
  dropFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.25rem",
  },
  dropEmail: {
    fontSize: "0.8125rem",
    color: "#94a3b8",
  },
};
