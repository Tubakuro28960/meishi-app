import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "名刺OCR・メール送信支援アプリ",
  description: "名刺を読み取り、メールを効率的に送信するアプリです",
};

const css = `
/* ── Keyframes ───────────────────────────────── */
@keyframes fadeIn   { from{opacity:0}                              to{opacity:1} }
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)}   to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown { from{opacity:0;transform:translateY(-10px)}  to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.96)}        to{opacity:1;transform:scale(1)} }
@keyframes shimmer  {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* ── Page ────────────────────────────────────── */
.page-fade { animation: fadeIn 0.3s ease; }

/* ── List stagger ────────────────────────────── */
.list-item { animation: fadeUp 0.38s ease both; }
.list-item:nth-child(1)  { animation-delay: 0.04s }
.list-item:nth-child(2)  { animation-delay: 0.08s }
.list-item:nth-child(3)  { animation-delay: 0.12s }
.list-item:nth-child(4)  { animation-delay: 0.16s }
.list-item:nth-child(5)  { animation-delay: 0.20s }
.list-item:nth-child(6)  { animation-delay: 0.24s }
.list-item:nth-child(7)  { animation-delay: 0.28s }
.list-item:nth-child(8)  { animation-delay: 0.32s }
.list-item:nth-child(9)  { animation-delay: 0.36s }
.list-item:nth-child(10) { animation-delay: 0.40s }
.list-item:nth-child(n+11){ animation-delay: 0.44s }

/* ── Card hover ──────────────────────────────── */
.card-hover {
  transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
  will-change: transform;
}
.card-hover:hover {
  box-shadow: 0 10px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06) !important;
  transform: translateY(-3px);
}

/* ── Buttons ─────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  transition: background 0.16s, box-shadow 0.16s, transform 0.1s, opacity 0.16s, border-color 0.16s;
  cursor: pointer; font-weight: 600; border-radius: 8px; border: none;
}
.btn:active:not(:disabled) { transform: scale(0.95) !important; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(37,99,235,0.25);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  box-shadow: 0 6px 18px rgba(37,99,235,0.38);
}

.btn-secondary {
  background: #fff; color: #374151;
  border: 1.5px solid #d1d5db !important;
}
.btn-secondary:hover:not(:disabled) {
  background: #f8fafc; border-color: #9ca3af !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.btn-danger {
  background: #fff; color: #dc2626;
  border: 1.5px solid #fca5a5 !important;
}
.btn-danger:hover:not(:disabled) {
  background: #fef2f2; border-color: #f87171 !important;
  box-shadow: 0 2px 8px rgba(220,38,38,0.15);
}

.btn-success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(22,163,74,0.25);
}
.btn-success:hover:not(:disabled) {
  box-shadow: 0 6px 18px rgba(22,163,74,0.38);
}

/* ── Input focus ─────────────────────────────── */
.input-fx {
  transition: border-color 0.18s, box-shadow 0.18s;
  outline: none !important;
}
.input-fx:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3.5px rgba(37,99,235,0.14) !important;
}

/* ── Nav ─────────────────────────────────────── */
.nav-link-fx {
  transition: background 0.15s, color 0.15s;
  border-radius: 6px;
}
.nav-link-fx:hover { background: rgba(255,255,255,0.14) !important; color: #fff !important; }

/* ── Dropdown ────────────────────────────────── */
.dropdown-anim { animation: fadeDown 0.2s ease; }

/* ── Responsive ──────────────────────────────── */
.nav-desktop { display: flex; }
.nav-mobile  { display: none; }
.nav-email   { display: inline; }
.app-main {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

@media (max-width: 640px) {
  .nav-desktop { display: none !important; }
  .nav-mobile  { display: flex !important; }
  .nav-email   { display: none !important; }
  .app-main    { padding: 1rem; }
  .grid-2col   { grid-template-columns: 1fr !important; }
  .dropzone-mobile { min-height: 140px !important; padding: 1.5rem !important; }
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
