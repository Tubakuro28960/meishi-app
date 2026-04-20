import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "名刺OCR・メール送信支援アプリ",
  description: "名刺を読み取り、メールを効率的に送信するアプリです",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
