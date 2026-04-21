export type TemplateVars = {
  name?: string | null;
  company?: string | null;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  sender_name?: string | null;
};

export const TEMPLATE_VARIABLES: {
  key: string;
  label: string;
  example: string;
}[] = [
  { key: "{{氏名}}",    label: "氏名",     example: "山田 太郎" },
  { key: "{{会社名}}",  label: "会社名",   example: "株式会社サンプル" },
  { key: "{{部署}}",    label: "部署",     example: "営業部" },
  { key: "{{役職}}",    label: "役職",     example: "部長" },
  { key: "{{メール}}",  label: "メール",   example: "yamada@example.com" },
  { key: "{{送信者名}}",label: "送信者名", example: "田中 花子" },
];

export const PREVIEW_SAMPLE: TemplateVars = {
  name:        "山田 太郎",
  company:     "株式会社サンプル",
  department:  "営業部",
  position:    "部長",
  email:       "yamada@example.com",
  sender_name: "田中 花子",
};

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template
    // 日本語変数（新形式）
    .replace(/\{\{氏名\}\}/g,    vars.name        ?? "")
    .replace(/\{\{会社名\}\}/g,  vars.company     ?? "")
    .replace(/\{\{部署\}\}/g,    vars.department  ?? "")
    .replace(/\{\{役職\}\}/g,    vars.position    ?? "")
    .replace(/\{\{メール\}\}/g,  vars.email       ?? "")
    .replace(/\{\{送信者名\}\}/g,vars.sender_name ?? "")
    // 英語変数（既存テンプレートの後方互換）
    .replace(/\{\{name\}\}/g,        vars.name        ?? "")
    .replace(/\{\{full_name\}\}/g,   vars.name        ?? "")
    .replace(/\{\{company\}\}/g,     vars.company     ?? "")
    .replace(/\{\{company_name\}\}/g,vars.company     ?? "")
    .replace(/\{\{department\}\}/g,  vars.department  ?? "")
    .replace(/\{\{position\}\}/g,    vars.position    ?? "")
    .replace(/\{\{email\}\}/g,       vars.email       ?? "")
    .replace(/\{\{sender_name\}\}/g, vars.sender_name ?? "")
    .replace(/\{\{signature\}\}/g,   vars.sender_name ?? "");
}

export const SAMPLE_TEMPLATE = {
  name: "名刺交換後のご挨拶",
  subject_template: "{{会社名}} {{氏名}}様 - 名刺交換のお礼",
  body_template: `{{氏名}}様

先日はお名刺を交換いただきありがとうございました。
{{会社名}}にて{{部署}}の{{役職}}をされているとのこと、
大変勉強になりました。

今後ともどうぞよろしくお願いいたします。
ご不明な点などございましたら、お気軽にご連絡ください。

{{送信者名}}`,
};
