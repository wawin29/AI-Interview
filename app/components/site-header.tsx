import Link from "next/link";
import { SparklesIcon } from "./icons";
import { ApiKeySettings } from "./api-key-settings";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[.06] bg-white/80 backdrop-blur-md dark:border-white/[.08] dark:bg-black/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <SparklesIcon className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-black dark:text-zinc-50">
            Interviewly
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:flex">
          <Link href="/#features" className="transition-colors hover:text-black dark:hover:text-zinc-50">
            功能特色
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-black dark:hover:text-zinc-50">
            使用方式
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ApiKeySettings />
          <Link
            href="/interview"
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            開始模擬面試
          </Link>
        </div>
      </div>
    </header>
  );
}
