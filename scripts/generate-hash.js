/**
 * 新規顧客追加用ハッシュ生成スクリプト
 *
 * 使い方:
 *   node scripts/generate-hash.js
 *
 * 出力されたSQLをSupabase SQL Editorで実行してください。
 */

const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("=== 新規顧客アカウント追加ツール ===\n");

  const email = await ask("顧客のメールアドレス: ");
  const password = await ask("初期パスワード (顧客に通知するもの): ");
  const company = await ask("会社名: ");

  const hash = await bcrypt.hash(password, 12);

  console.log("\n以下のSQLをSupabase SQL Editorで実行してください:\n");
  console.log("------------------------------------------------------");
  console.log(`INSERT INTO public.allowed_accounts (email, initial_password_hash, company_name)`);
  console.log(`VALUES (`);
  console.log(`  '${email}',`);
  console.log(`  '${hash}',`);
  console.log(`  '${company}'`);
  console.log(`);`);
  console.log("------------------------------------------------------");
  console.log("\n顧客にはメールアドレスと初期パスワードを別途通知してください。");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
