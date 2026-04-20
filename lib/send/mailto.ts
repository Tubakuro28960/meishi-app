/**
 * mailto: URL を生成する。
 * 件名・本文は encodeURIComponent で RFC 2368 準拠のパーセントエンコーディング。
 * 日本語は UTF-8 として %XX%XX... に変換される。
 * 改行 \n → %0A（主要メールクライアントで正しく解釈される）。
 * メールアドレスは mailto: スキームでは @ をエンコードしない。
 */
export function buildMailtoUrl(
  to: string,
  subject: string,
  body: string
): string {
  return (
    `mailto:${to}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

/**
 * Gmail 作成画面 URL を生成する。
 * クエリパラメータは encodeURIComponent でエンコード。
 * Gmail は su= が件名、body= が本文。
 */
export function buildGmailUrl(
  to: string,
  subject: string,
  body: string
): string {
  const parts = [
    "view=cm",
    "fs=1",
    `to=${encodeURIComponent(to)}`,
    `su=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`,
  ];
  return `https://mail.google.com/mail/?${parts.join("&")}`;
}

export type MailMode = "mailto" | "gmail";

export function buildUrl(
  mode: MailMode,
  to: string,
  subject: string,
  body: string
): string {
  return mode === "gmail"
    ? buildGmailUrl(to, subject, body)
    : buildMailtoUrl(to, subject, body);
}
