import { NextRequest, NextResponse } from "next/server";
import { processScheduledJobs } from "@/lib/scheduler/processor";

/** Vercel などでの最大実行時間（秒）*/
export const maxDuration = 60;

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[scheduler] CRON_SECRET が設定されていません");
    return NextResponse.json(
      { error: "CRON_SECRET が設定されていません" },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[scheduler] 開始:", new Date().toISOString());

  try {
    const result = await processScheduledJobs();

    console.log(
      `[scheduler] 完了: processed=${result.processed} succeeded=${result.succeeded}` +
      ` failed=${result.failed} skipped=${result.skipped}`
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[scheduler] 予期しないエラー:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/scheduler — curl / pg_net / GitHub Actions から呼ぶ */
export const POST = handle;

/** GET /api/scheduler — Vercel Cron は GET を送信する */
export const GET = handle;
