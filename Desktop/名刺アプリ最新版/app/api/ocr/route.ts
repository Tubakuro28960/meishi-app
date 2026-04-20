import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const BUCKET = "card-images";
const MAX_BYTES = 10 * 1024 * 1024;

const SYSTEM_PROMPT = `あなたは名刺情報を抽出するエキスパートです。
画像に含まれる名刺を全て検出し、それぞれの情報をJSONで返してください。

以下のJSON形式のみで返してください（説明文は不要）:
{
  "cards": [
    {
      "name": "氏名（フルネーム）",
      "company": "会社名・法人名",
      "department": "部署名",
      "position": "役職",
      "email": "メールアドレス",
      "phone": "電話番号",
      "address": "住所",
      "website": "WebサイトURL"
    }
  ]
}

ルール:
- 画像内の全ての名刺を検出すること
- 情報が読み取れない・存在しない場合は空文字列 "" にする
- 電話番号が複数ある場合は最初の1つ
- JSONのみ返す（マークダウンのコードブロックも不要）`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR機能が設定されていません（ANTHROPIC_API_KEY が未設定）" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエストの解析に失敗しました" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像ファイルが必要です" }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
    return NextResponse.json(
      { error: "JPG または PNG のみ対応しています" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: "ファイルサイズは10MB以下にしてください" },
      { status: 400 }
    );
  }

  const buffer = new Uint8Array(arrayBuffer);
  const ext = file.type === "image/png" ? "png" : "jpg";
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `画像のアップロードに失敗しました: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: { publicUrl: imageUrl } } = serviceClient.storage
    .from(BUCKET).getPublicUrl(storagePath);

  const CLAUDE_MAX_BYTES = 5 * 1024 * 1024; // Claude's 5MB decoded limit
  if (arrayBuffer.byteLength > CLAUDE_MAX_BYTES) {
    await serviceClient.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: `画像が大きすぎます（${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB）。5MB以下の画像を使用してください。` },
      { status: 400 }
    );
  }

  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  const mediaType = file.type === "image/png" ? "image/png" : "image/jpeg";

  const client = new Anthropic({ apiKey });

  let responseText: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Image },
            },
            {
              type: "text",
              text: "この画像に含まれる全ての名刺の情報を抽出してください。",
            },
          ],
        },
      ],
    });

    responseText = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");
  } catch (e) {
    return NextResponse.json(
      { error: `Claude API の呼び出しに失敗しました: ${String(e)}` },
      { status: 500 }
    );
  }

  let parsed: { cards: Record<string, string>[] };
  try {
    const jsonText = responseText.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      { error: `レスポンスの解析に失敗しました: ${responseText.slice(0, 200)}` },
      { status: 500 }
    );
  }

  const cards = (parsed.cards ?? []).map(card => ({
    rawText: Object.values(card).filter(Boolean).join("\n"),
    structured: {
      name: card.name ?? "",
      company: card.company ?? "",
      department: card.department ?? "",
      position: card.position ?? "",
      email: card.email ?? "",
      phone: card.phone ?? "",
      address: card.address ?? "",
      website: card.website ?? "",
    },
  }));

  if (cards.length === 0) {
    cards.push({
      rawText: "",
      structured: { name: "", company: "", department: "", position: "", email: "", phone: "", address: "", website: "" },
    });
  }

  return NextResponse.json({ imageUrl, cards });
}
