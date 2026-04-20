import type { NextConfig } from "next";

// Next.js 16 は next build のデフォルトバンドラーが Turbopack。
// プロジェクトパスに non-ASCII 文字が含まれると TurbopackInternalError が発生する。
// package.json の dev/build スクリプトに --webpack を付けて回避している。
const nextConfig: NextConfig = {};

export default nextConfig;
