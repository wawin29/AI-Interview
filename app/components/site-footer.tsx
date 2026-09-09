import Link from "next/link";
import { SparklesIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[.06] bg-zinc-50 dark:border-white/[.08] dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-black dark:text-zinc-50">Interviewly</span>
          </div>
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            由 AI 驅動的模擬面試練習工具,協助求職者在正式面試前充分準備。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-black dark:text-zinc-50">產品</span>
          <Link
            href="/#features"
            className="text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            功能特色
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            使用方式
          </Link>
          <Link
            href="/interview"
            className="text-sm text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            開始模擬面試
          </Link>
        </div>
      </div>

      <div className="border-t border-black/[.06] px-6 py-6 text-center text-xs text-zinc-400 dark:border-white/[.08] dark:text-zinc-500">
        © {new Date().getFullYear()} Interviewly · 本工具僅供練習與展示用途
      </div>
    </footer>
  );
}
