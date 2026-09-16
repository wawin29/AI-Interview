import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse(內部使用 pdfjs-dist)在打包後會找不到它的 worker 檔案路徑,
  // 排除在打包之外、改用 Node 原生 require 從 node_modules 讀取,才能正常運作。
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // pdfjs-dist 解析含有中文等 CJK 字型的 PDF 時,需要額外讀取 cmaps / standard_fonts
  // 這些非 JS 資源檔。Vercel 等平台部署時的檔案追蹤(file tracing)預設抓不到這些
  // 動態路徑讀取的檔案,若沒有這行設定,中文履歷 PDF 在正式環境會解析失敗
  // (本機 npm run dev / start 因為完整 node_modules 都在,不會出現這個問題)。
  outputFileTracingIncludes: {
    "/api/parse-resume": [
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
    ],
  },
};

export default nextConfig;
