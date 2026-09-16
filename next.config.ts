import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse(內部使用 pdfjs-dist)在打包後會找不到它的 worker 檔案路徑,
  // 排除在打包之外、改用 Node 原生 require 從 node_modules 讀取,才能正常運作。
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
