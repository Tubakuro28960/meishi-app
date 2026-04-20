#!/usr/bin/env bash
# ローカル開発用: スケジューラーを手動でトリガーする
#
# 使い方:
#   bash scripts/trigger-scheduler.sh
#   bash scripts/trigger-scheduler.sh http://localhost:3000  # URL 指定
#
# 前提: .env.local に CRON_SECRET が設定されていること

set -euo pipefail

# 引数 or デフォルト URL
BASE_URL="${1:-http://localhost:3000}"

# .env.local から CRON_SECRET を読み込む
ENV_FILE="$(dirname "$0")/../.env.local"
if [[ -f "$ENV_FILE" ]]; then
  # ShellCheck: ソース経由で読み込み
  # shellcheck disable=SC1090
  CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d'=' -f2-)"
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "ERROR: CRON_SECRET が見つかりません。.env.local を確認してください。"
  exit 1
fi

echo "→ POST ${BASE_URL}/api/scheduler"
curl -s -X POST "${BASE_URL}/api/scheduler" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  | jq .
