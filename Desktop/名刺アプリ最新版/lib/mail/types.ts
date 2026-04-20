/** メール送信パラメータ */
export type SendParams = {
  to: string;
  subject: string;
  /** プレーンテキスト本文。改行は \n */
  body: string;
  fromName?: string;
  fromEmail?: string;
};

/** 送信結果 */
export type SendResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

/**
 * メール送信プロバイダのインターフェース。
 * 新しいプロバイダを追加する場合はこのインターフェースを実装し、
 * lib/mail/index.ts の getMailProvider() に case を追加する。
 */
export interface MailProvider {
  /** プロバイダ識別名（ログ・デバッグ用） */
  readonly name: string;
  send(params: SendParams): Promise<SendResult>;
}
