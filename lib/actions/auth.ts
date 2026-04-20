"use server";

import { createServiceClient } from "@/lib/supabase/service";
import bcrypt from "bcryptjs";

type RegisterResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function registerWithAllowedAccount(
  email: string,
  password: string
): Promise<RegisterResult> {
  const supabase = createServiceClient();

  // allowed_accounts にメールアドレスが存在するか確認
  const { data: account, error: fetchError } = await supabase
    .from("allowed_accounts")
    .select("id, initial_password_hash, company_name, is_active, registered_user_id")
    .eq("email", email)
    .single();

  // 存在しない場合は「登録不可」とのみ伝える（メール存在有無を漏らさない）
  if (fetchError || !account) {
    return { success: false, error: "このメールアドレスは登録が許可されていません" };
  }

  // 無効化されているアカウント
  if (!account.is_active) {
    return { success: false, error: "このアカウントは現在無効です。管理者にお問い合わせください" };
  }

  // 既に別のユーザーが同じ初期情報で登録済み
  if (account.registered_user_id) {
    return { success: false, error: "このメールアドレスはすでに登録されています" };
  }

  // 初期パスワードを bcrypt で検証
  const isPasswordValid = await bcrypt.compare(password, account.initial_password_hash);
  if (!isPasswordValid) {
    // パスワード不一致もメール不存在と同じメッセージにして情報漏洩を防ぐ
    return { success: false, error: "このメールアドレスは登録が許可されていません" };
  }

  // Supabase auth にユーザーを作成（事前許可済みのためメール確認不要）
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !newUser?.user) {
    if (createError?.message?.includes("already been registered")) {
      return { success: false, error: "このメールアドレスはすでに登録されています" };
    }
    console.error("createUser error:", createError);
    return { success: false, error: "アカウントの作成に失敗しました。再度お試しください" };
  }

  // 登録完了を allowed_accounts に記録（同じ初期情報での2重登録を防止）
  const { error: updateError } = await supabase
    .from("allowed_accounts")
    .update({
      registered_user_id: newUser.user.id,
      used_at: new Date().toISOString(),
    })
    .eq("id", account.id);

  if (updateError) {
    console.error("allowed_accounts update error:", updateError);
    // ユーザー作成は成功しているのでここでは致命的エラーにしない
  }

  return {
    success: true,
    message: "登録が完了しました。同じメールアドレスとパスワードでログインしてください",
  };
}
