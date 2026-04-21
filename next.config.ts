import type { NextConfig } from "next";
import path from "path";

// Next.js 16 は next build のデフォルトバンドラーが Turbopack。
// プロジェクトパスに non-ASCII 文字が含まれると TurbopackInternalError が発生する。
// package.json の dev/build スクリプトに --webpack を付けて回避している。
const nextConfig: NextConfig = {
  webpack(config) {
    // @supabase/supabase-js v2.103 の ESM re-export が webpack の tree-shaking と
    // 相性が悪いため CJS ビルドを明示的に使用する
    const supabaseDir = path.dirname(
      require.resolve("@supabase/supabase-js/package.json")
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "@supabase/postgrest-js": path.resolve(
        path.dirname(require.resolve("@supabase/postgrest-js/package.json")),
        "dist/index.cjs"
      ),
      "@supabase/storage-js": path.resolve(
        path.dirname(require.resolve("@supabase/storage-js/package.json")),
        "dist/index.cjs"
      ),
    };
    return config;
  },
};

export default nextConfig;
