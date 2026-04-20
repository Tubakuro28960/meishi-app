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
  description: string;
}[] = [
  { key: "{{name}}",        label: "氏名",           example: "山田 太郎",           description: "名刺から読み取った氏名" },
  { key: "{{company}}",     label: "会社名",          example: "株式会社サンプル",      description: "会社名" },
  { key: "{{department}}", label: "部署名",           example: "営業部",              description: "部署名" },
  { key: "{{position}}",   label: "役職",             example: "部長",                description: "役職" },
  { key: "{{email}}",      label: "メールアドレス",    example: "yamada@example.com",  description: "宛先メールアドレス" },
  { key: "{{sender_name}}",label: "送信者名",         example: "田中 花子",            description: "送信者（あなた）の名前" },
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
  subject_template: "{{company}} {{name}}様 - 名刺交換のお礼",
  body_template: `{{name}}様

先日はお名刺を交換いただきありがとうございました。
{{company}}にて{{department}}の{{position}}をされているとのこと、
大変勉強になりました。

今後ともどうぞよろしくお願いいたします。
ご不明な点などございましたら、お気軽にご連絡ください。

{{sender_name}}`,
};
