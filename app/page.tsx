import Link from "next/link";
import {
  ArrowRightIcon,
  LightbulbIcon,
  MessageIcon,
  SlidersIcon,
  SparklesIcon,
} from "./components/icons";

const FEATURES = [
  {
    icon: SlidersIcon,
    title: "自訂題數,彈性準備",
    description: "依照你的準備時間,設定 1 到 10 題,快速練習或完整模擬都可以。",
  },
  {
    icon: MessageIcon,
    title: "動態追問,更貼近真實面試",
    description: "AI 面試官會根據你上一題的回答決定要追問還是換主題,而不是照本宣科。",
  },
  {
    icon: LightbulbIcon,
    title: "逐題更好回答示範",
    description: "面試結束後,針對每一題提供更完整、更有說服力的回答方向。",
  },
  {
    icon: SparklesIcon,
    title: "根據職缺客製化題目",
    description: "貼上職缺描述,問題會直接對應該職位真正重視的技能與職責。",
  },
];

const STEPS = [
  {
    step: "01",
    title: "貼上職缺描述",
    description: "複製你想準備的職缺內容,設定想練習的題數。",
  },
  {
    step: "02",
    title: "回答 AI 面試官提問",
    description: "像真的面試一樣一題一題作答,AI 會視情況追問或換主題。",
  },
  {
    step: "03",
    title: "取得評分與建議",
    description: "完成後立即取得整體評分、優缺點分析,以及每題的更好回答示範。",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 opacity-20 blur-3xl dark:opacity-25"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 pb-24 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[.08] bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-white/[.12] dark:bg-zinc-900 dark:text-zinc-300">
            <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
            由 OpenAI 驅動 · 免費開始使用
          </span>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-black sm:text-6xl dark:text-zinc-50">
            用 AI 面試官,
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              練到真正的面試前
            </span>
          </h1>

          <p className="max-w-xl text-balance text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            貼上任何職缺描述,Interviewly 會化身面試官,依照職缺量身出題、即時追問,並在結束後給你評分與具體的回答建議。
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/interview"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              開始模擬面試
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-black/[.1] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-black/[.04] dark:border-white/[.15] dark:text-zinc-50 dark:hover:bg-white/[.08]"
            >
              了解如何運作
            </Link>
          </div>

          {/* Product preview mockup */}
          <div className="relative mt-12 w-full max-w-3xl">
            <div className="rounded-2xl border border-black/[.08] bg-white p-6 text-left shadow-xl dark:border-white/[.1] dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                    AI
                  </span>
                  <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                    請分享一個你用 React 解決效能問題的經驗?
                  </div>
                </div>
                <div className="flex items-start justify-end gap-2">
                  <div className="rounded-2xl rounded-tr-sm bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black">
                    我曾透過 memoization 與虛擬清單,把列表渲染時間降低 60%...
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                    你
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -right-4 hidden w-56 rotate-3 rounded-2xl border border-black/[.08] bg-white p-4 shadow-xl sm:block dark:border-white/[.1] dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">總體評分</p>
              <p className="text-3xl font-semibold text-black dark:text-zinc-50">
                88 <span className="text-sm font-normal text-zinc-400">/ 100</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                技術深度佳,建議補充量化成果
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            不只是出題機,更像一位真面試官
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            每一次練習都根據你的職缺與回答動態調整,結束後給你具體、可以馬上用的建議。
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-2xl border border-black/[.06] bg-white p-6 dark:border-white/[.08] dark:bg-zinc-900"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-black/[.06] bg-zinc-50 py-24 dark:border-white/[.08] dark:bg-zinc-950"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              三個步驟,開始練習
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              從貼上職缺到拿到回饋,全程不到五分鐘。
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900"
              >
                <span className="text-sm font-semibold text-indigo-500">{s.step}</span>
                <h3 className="text-lg font-semibold text-black dark:text-zinc-50">{s.title}</h3>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-16 text-center shadow-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            準備好迎接下一場面試了嗎?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-indigo-100">
            現在就貼上職缺描述,讓 AI 面試官陪你練習到有信心為止。
          </p>
          <Link
            href="/interview"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition-transform hover:scale-[1.02]"
          >
            免費開始模擬面試
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
