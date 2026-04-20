export type BusinessCard = {
  id: string;
  user_id: string;
  original_image_url: string | null;
  raw_ocr_text: string | null;
  name: string | null;
  company: string | null;
  department: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  memo: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  user_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateFormValues = {
  name: string;
  subject_template: string;
  body_template: string;
  is_default: boolean;
};

export type SendJob = {
  id: string;
  user_id: string;
  business_card_id: string | null;
  template_id: string | null;
  mode: "immediate" | "scheduled";
  to_email: string;
  subject: string;
  body: string;
  scheduled_at: string | null;
  sent_at: string | null;
  status: "pending" | "processing" | "sent" | "failed" | "canceled";
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
};

export type SendLog = {
  id: string;
  send_job_id: string;
  attempt_no: number;
  result: "success" | "failed";
  response_summary: string | null;
  created_at: string;
};

export type AllowedAccount = {
  id: string;
  email: string;
  initial_password_hash: string;
  company_name: string | null;
  is_active: boolean;
  registered_user_id: string | null;
  used_at: string | null;
  created_at: string;
};

export type CardFormValues = {
  name: string;
  company: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  memo: string;
  raw_ocr_text?: string;
  original_image_url?: string;
};
