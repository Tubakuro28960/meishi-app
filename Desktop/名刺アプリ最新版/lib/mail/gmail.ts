import type { MailProvider, SendParams, SendResult } from "./types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`トークンリフレッシュ失敗: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function buildRawMessage(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): string {
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(params.body).toString("base64"),
  ];
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export class GmailProvider implements MailProvider {
  readonly name = "gmail";

  constructor(
    private readonly refreshToken: string,
    private readonly gmailEmail: string
  ) {}

  async send(params: SendParams): Promise<SendResult> {
    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(this.refreshToken);
    } catch (e) {
      return { success: false, error: String(e) };
    }

    const raw = buildRawMessage({
      from:    this.gmailEmail,
      to:      params.to,
      subject: params.subject,
      body:    params.body,
    });

    let res: Response;
    try {
      res = await fetch(GMAIL_SEND_URL, {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      });
    } catch (e) {
      return { success: false, error: `ネットワークエラー: ${String(e)}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Gmail API ${res.status}: ${text}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, messageId: (data as { id?: string }).id ?? "" };
  }
}
