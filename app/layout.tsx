import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "名刺OCR・メール送信支援アプリ",
  description: "名刺を読み取り、メールを効率的に送信するアプリです",
};

const responsiveStyles = `
  .nav-desktop { display: flex; }
  .nav-mobile  { display: none; }
  .nav-email   { display: inline; }
  .app-main    { flex: 1; padding: 2rem 1.5rem; max-width: 1100px; width: 100%; margin: 0 auto; }
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  @media (max-width: 640px) {
    .nav-desktop { display: none !important; }
    .nav-mobile  { display: flex !important; }
    .nav-email   { display: none !important; }
    .app-main    { padding: 1rem; }
    .table-scroll { overflow-x: auto; }
    .grid-2col   { grid-template-columns: 1fr !important; }
    .dropzone-mobile { min-height: 140px !important; padding: 1.5rem !important; }
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
