import type { MailProvider, SendParams, SendResult } from "./types";

const RESEND_API = "https://api.resend.com/emails";

export class ResendProvider implements MailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly defaultFrom: string
  ) {}

  async send(params: SendParams): Promise<SendResult> {
    const from = params.fromEmail
      ? params.fromName
        ? `${params.fromName} <${params.fromEmail}>`
        : params.fromEmail
      : this.defaultFrom;

    let res: Response;
    try {
      res = await fetch(RESEND_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          text: params.body,
        }),
      });
    } catch (e) {
      return { success: false, error: `ネットワークエラー: ${String(e)}` };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Resend ${res.status}: ${text}` };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, messageId: (data as { id?: string }).id ?? "" };
  }
}
