import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code    = searchParams.get("code");
  const userId  = searchParams.get("state");
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/settings?gmail=error`);
  }

  // 認可コードをトークンに交換
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${appUrl}/api/auth/gmail/callback`,
      grant_type:    "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("[gmail/callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/settings?gmail=error`);
  }

  const tokens = await tokenRes.json();
  const refreshToken: string = tokens.refresh_token;
  if (!refreshToken) {
    return NextResponse.redirect(`${appUrl}/settings?gmail=no_refresh_token`);
  }

  // ユーザーのGmailアドレスを取得
  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userinfo = userinfoRes.ok ? await userinfoRes.json() : {};
  const gmailEmail: string = userinfo.email ?? "";

  // DBに保存（upsert）
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("user_gmail_tokens")
    .upsert({ user_id: userId, gmail_email: gmailEmail, refresh_token: refreshToken });

  if (error) {
    console.error("[gmail/callback] db upsert failed:", error.message);
    return NextResponse.redirect(`${appUrl}/settings?gmail=error`);
  }

  return NextResponse.redirect(`${appUrl}/settings?gmail=connected`);
}
