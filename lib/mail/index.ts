import type { MailProvider } from "./types";
import { ResendProvider } from "./resend";

/**
 * 環境変数 MAIL_PROVIDER でプロバイダを切り替える。
 * 新しいプロバイダを追加するには:
 *   1. lib/mail/<name>.ts に MailProvider を実装するクラスを作成
 *   2. 以下の switch に case を追加
 *   3. .env.local に MAIL_PROVIDER=<name> を設定
 */
export function getMailProvider(): MailProvider {
  const name = process.env.MAIL_PROVIDER ?? "resend";

  switch (name) {
    case "resend": {
      const key  = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (!key)  throw new Error("RESEND_API_KEY が設定されていません");
      if (!from) throw new Error("RESEND_FROM_EMAIL が設定されていません");
      return new ResendProvider(key, from);
    }

    // case "sendgrid": {
    //   return new SendGridProvider(process.env.SENDGRID_API_KEY!, ...);
    // }

    default:
      throw new Error(`未対応の MAIL_PROVIDER: "${name}"`);
  }
}

export type { MailProvider, SendParams, SendResult } from "./types";
