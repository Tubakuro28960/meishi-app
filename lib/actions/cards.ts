"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CardFormValues } from "@/types/database";

export async function createCards(
  cards: CardFormValues[]
): Promise<{ error: string } | void> {
  if (cards.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const baseIndex = count ?? 0;

  const rows = cards.map((data, i) => {
    const { raw_ocr_text, original_image_url, ...fields } = data;
    return {
      ...fields,
      user_id: user.id,
      card_index: baseIndex + i + 1,
      ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
      ...(original_image_url !== undefined ? { original_image_url } : {}),
    };
  });

  const { error } = await supabase.from("business_cards").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/cards");
  redirect("/cards");
}

export async function createCard(
  data: CardFormValues
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { raw_ocr_text, original_image_url, ...fields } = data;

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase.from("business_cards").insert({
    ...fields,
    user_id: user.id,
    card_index: (count ?? 0) + 1,
    ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
    ...(original_image_url !== undefined ? { original_image_url } : {}),
  });

  if (error) return { error: error.message };

  revalidatePath("/cards");
  redirect("/cards");
}

// リダイレクトなしでカードを保存し、IDを返す（メールアプリ連携用）
export async function saveCardAndReturn(
  data: CardFormValues
): Promise<{ error: string } | { id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { raw_ocr_text, original_image_url, ...fields } = data;

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: card, error } = await supabase
    .from("business_cards")
    .insert({
      ...fields,
      user_id: user.id,
      card_index: (count ?? 0) + 1,
      ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
      ...(original_image_url !== undefined ? { original_image_url } : {}),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/cards");
  return { id: card.id };
}

export async function updateCard(
  id: string,
  data: CardFormValues
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("business_cards")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/cards");
  revalidatePath(`/cards/${id}`);
  redirect(`/cards/${id}`);
}

export async function createCardAndSend(
  cardData: CardFormValues,
  sendData: {
    template_id: string;
    subject: string;
    body: string;
    timing: "immediate" | "scheduled";
    scheduled_at?: string;
  }
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (!cardData.email) return { error: "メールアドレスがありません" };

  const { raw_ocr_text, original_image_url, ...fields } = cardData;

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: card, error: cardError } = await supabase
    .from("business_cards")
    .insert({
      ...fields,
      user_id: user.id,
      card_index: (count ?? 0) + 1,
      ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
      ...(original_image_url !== undefined ? { original_image_url } : {}),
    })
    .select("id")
    .single();

  if (cardError) return { error: cardError.message };

  const jobRecord: Record<string, unknown> = {
    user_id: user.id,
    business_card_id: card.id,
    template_id: sendData.template_id,
    mode: sendData.timing,
    to_email: cardData.email,
    subject: sendData.subject,
    body: sendData.body,
    status: "pending",
    retry_count: 0,
  };

  if (sendData.timing === "scheduled" && sendData.scheduled_at) {
    jobRecord.scheduled_at = new Date(sendData.scheduled_at).toISOString();
  }

  const { error: jobError } = await supabase.from("send_jobs").insert(jobRecord);
  if (jobError) return { error: jobError.message };

  revalidatePath("/cards");
  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function createCardsAndSend(
  cards: Array<{
    cardData: CardFormValues;
    sendData?: {
      template_id: string;
      subject: string;
      body: string;
      timing: "immediate" | "scheduled";
      scheduled_at?: string;
    };
  }>
): Promise<{ error: string } | void> {
  if (cards.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const baseIndex = count ?? 0;

  for (let i = 0; i < cards.length; i++) {
    const { cardData, sendData } = cards[i];
    const { raw_ocr_text, original_image_url, ...fields } = cardData;

    const { data: card, error: cardError } = await supabase
      .from("business_cards")
      .insert({
        ...fields,
        user_id: user.id,
        card_index: baseIndex + i + 1,
        ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
        ...(original_image_url !== undefined ? { original_image_url } : {}),
      })
      .select("id")
      .single();

    if (cardError) return { error: cardError.message };

    if (sendData && cardData.email) {
      const jobRecord: Record<string, unknown> = {
        user_id: user.id,
        business_card_id: card.id,
        template_id: sendData.template_id,
        mode: sendData.timing,
        to_email: cardData.email,
        subject: sendData.subject,
        body: sendData.body,
        status: "pending",
        retry_count: 0,
      };

      if (sendData.timing === "scheduled" && sendData.scheduled_at) {
        jobRecord.scheduled_at = new Date(sendData.scheduled_at).toISOString();
      }

      const { error: jobError } = await supabase.from("send_jobs").insert(jobRecord);
      if (jobError) return { error: jobError.message };
    }
  }

  revalidatePath("/cards");
  revalidatePath("/jobs");

  const hasSend = cards.some((c) => c.sendData);
  redirect(hasSend ? "/jobs" : "/cards");
}

// 複数枚保存＋予約ジョブ登録（即時送信はGmail URLをクライアントで開くためリダイレクトしない）
export async function createCardsAndSchedule(
  cards: Array<{
    cardData: CardFormValues;
    scheduledSendData?: {
      template_id: string;
      subject: string;
      body: string;
      scheduled_at: string;
    };
  }>
): Promise<{ error: string } | void> {
  if (cards.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { count } = await supabase
    .from("business_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const baseIndex = count ?? 0;

  for (let i = 0; i < cards.length; i++) {
    const { cardData, scheduledSendData } = cards[i];
    const { raw_ocr_text, original_image_url, ...fields } = cardData;

    const { data: card, error: cardError } = await supabase
      .from("business_cards")
      .insert({
        ...fields,
        user_id: user.id,
        card_index: baseIndex + i + 1,
        ...(raw_ocr_text !== undefined ? { raw_ocr_text } : {}),
        ...(original_image_url !== undefined ? { original_image_url } : {}),
      })
      .select("id")
      .single();

    if (cardError) return { error: cardError.message };

    if (scheduledSendData && cardData.email) {
      const { error: jobError } = await supabase.from("send_jobs").insert({
        user_id: user.id,
        business_card_id: card.id,
        template_id: scheduledSendData.template_id,
        mode: "scheduled",
        to_email: cardData.email,
        subject: scheduledSendData.subject,
        body: scheduledSendData.body,
        status: "pending",
        retry_count: 0,
        scheduled_at: new Date(scheduledSendData.scheduled_at).toISOString(),
      });
      if (jobError) return { error: jobError.message };
    }
  }

  revalidatePath("/cards");
  revalidatePath("/jobs");
}

export async function deleteCard(
  id: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("business_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/cards");
  redirect("/cards");
}
