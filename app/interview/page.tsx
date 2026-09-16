"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ScoreRing } from "../components/score-ring";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  KeyIcon,
  LightbulbIcon,
  SpinnerIcon,
} from "../components/icons";
import {
  getApiKeyServerSnapshot,
  getStoredApiKey,
  requestOpenApiKeySettings,
  subscribeToApiKeyChanges,
} from "../lib/openai-key";

type Phase = "setup" | "interviewing" | "done";

interface HistoryItem {
  question: string;
  answer: string;
}

interface InterviewResult {
  score: number | null;
  summary: string;
  strengths: string[];
  improvements: string[];
  questionFeedback: string[];
}

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;
const DEFAULT_QUESTIONS = 3;
const PRESET_QUESTIONS = [3, 5, 7];
const MAX_RESUME_LENGTH = 8000;

export default function InterviewPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_QUESTIONS);
  const [phase, setPhase] = useState<Phase>("setup");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);

  // 履歷相關狀態:resumeText 是使用者貼上的履歷內容,useResume 則是是否勾選「依履歷出題」,
  // 兩者都會隨面試請求一起送到後端。
  const [resumeText, setResumeText] = useState("");
  const [useResume, setUseResume] = useState(false);

  // BYOK:金鑰存在瀏覽器 localStorage,是一個「外部狀態」,用 useSyncExternalStore 訂閱它的變化
  // (使用者在設定視窗儲存新金鑰時會觸發),比在 useEffect 裡手動 setState 更符合 React 的建議做法。
  const apiKey = useSyncExternalStore(
    subscribeToApiKeyChanges,
    getStoredApiKey,
    getApiKeyServerSnapshot
  );

  async function requestNextStep(nextHistory: HistoryItem[], rollback?: () => void) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-Api-Key": apiKey,
        },
        body: JSON.stringify({
          jobDescription,
          totalQuestions,
          history: nextHistory,
          resumeText,
          useResume,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "發生未知錯誤");
      }

      if (data.type === "question") {
        setHistory(nextHistory);
        setCurrentQuestion(data.question);
        setAnswerInput("");
        setPhase("interviewing");
      } else if (data.type === "result") {
        setHistory(nextHistory);
        setCurrentQuestion(null);
        setResult({
          score: data.score,
          summary: data.summary,
          strengths: data.strengths ?? [],
          improvements: data.improvements ?? [],
          questionFeedback: data.questionFeedback ?? [],
        });
        setPhase("done");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "發生未知錯誤");
      rollback?.();
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (!apiKey.trim()) {
      setErrorMsg("請先設定你的 OpenAI API Key");
      requestOpenApiKeySettings();
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg("請先輸入職缺描述");
      return;
    }
    if (
      !Number.isInteger(totalQuestions) ||
      totalQuestions < MIN_QUESTIONS ||
      totalQuestions > MAX_QUESTIONS
    ) {
      setErrorMsg(`題數必須為 ${MIN_QUESTIONS} 到 ${MAX_QUESTIONS} 之間的整數`);
      return;
    }
    if (useResume && !resumeText.trim()) {
      setErrorMsg("請先貼上履歷內容,或取消勾選「依履歷出題」");
      return;
    }
    requestNextStep([]);
  }

  function handleSubmitAnswer() {
    if (!answerInput.trim() || !currentQuestion) return;
    const previousHistory = history;
    const previousQuestion = currentQuestion;
    const previousAnswerInput = answerInput;
    const nextHistory = [...history, { question: previousQuestion, answer: previousAnswerInput.trim() }];

    // 樂觀更新:先把答案顯示在畫面上,並顯示「面試官輸入中」的動畫,等 API 回應後才決定下一步。
    setHistory(nextHistory);
    setCurrentQuestion(null);
    setAnswerInput("");

    requestNextStep(nextHistory, () => {
      setHistory(previousHistory);
      setCurrentQuestion(previousQuestion);
      setAnswerInput(previousAnswerInput);
    });
  }

  function handleRestart() {
    setJobDescription("");
    setTotalQuestions(DEFAULT_QUESTIONS);
    setPhase("setup");
    setHistory([]);
    setCurrentQuestion(null);
    setAnswerInput("");
    setErrorMsg(null);
    setResult(null);
    setResumeText("");
    setUseResume(false);
  }

  const isTyping = loading && phase === "interviewing" && !currentQuestion;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          返回首頁
        </Link>

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            AI 模擬面試
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            輸入職缺描述與題數,AI 面試官將依序提問,並在最後給予評分、建議與每一題的更好回答方式。
          </p>
        </header>

        {errorMsg && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {phase === "setup" && (
          <section className="flex flex-col gap-5 rounded-2xl border border-black/[.06] bg-white p-6 shadow-sm dark:border-white/[.08] dark:bg-zinc-900 sm:p-8">
            {!apiKey.trim() && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                <span className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4 shrink-0" />
                  尚未設定 OpenAI API Key,需要先設定才能開始面試。
                </span>
                <button
                  type="button"
                  onClick={requestOpenApiKeySettings}
                  className="shrink-0 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  立即設定
                </button>
              </div>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                職缺描述
              </span>
              <textarea
                className="min-h-40 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                placeholder="例如:我們正在尋找一位前端工程師,需熟悉 React、TypeScript,負責開發並維護公司的電商網站..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={loading}
              />
            </label>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  履歷內容(選填)
                </span>
                <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  貼上履歷文字後,AI 面試官可以結合你的實際經歷與職缺描述一起出題。
                </p>
                <textarea
                  className="min-h-32 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  placeholder="貼上你的履歷內容,例如工作經歷、專案、技能..."
                  value={resumeText}
                  maxLength={MAX_RESUME_LENGTH}
                  onChange={(e) => setResumeText(e.target.value)}
                  disabled={loading}
                />
              </label>

              {resumeText.trim() && (
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={useResume}
                    onChange={(e) => setUseResume(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-zinc-300 accent-indigo-600 dark:border-zinc-700"
                  />
                  依據履歷內容出題
                </label>
              )}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                題數(1 - 10 題)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_QUESTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTotalQuestions(n)}
                    disabled={loading}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                      totalQuestions === n
                        ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
                        : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {n} 題
                  </button>
                ))}
                <input
                  type="number"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  aria-label="自訂題數"
                  className="w-20 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </label>

            <button
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              onClick={handleStart}
              disabled={loading}
            >
              {loading && <SpinnerIcon className="h-4 w-4" />}
              {loading ? "產生問題中..." : "開始模擬面試"}
            </button>
          </section>
        )}

        {phase === "interviewing" && (
          <section className="flex flex-col gap-5">
            <div className="flex gap-1.5">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < history.length
                      ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <span className="-mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              第 {history.length + (currentQuestion ? 1 : 0)} / {totalQuestions} 題
            </span>

            <ol className="flex flex-col gap-4">
              {history.map((item, idx) => (
                <li key={idx} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                      AI
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-sm text-black shadow-sm dark:bg-zinc-800 dark:text-zinc-50">
                      <span className="mr-1 font-medium text-indigo-500">Q{idx + 1}.</span>
                      {item.question}
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-2">
                    <div className="rounded-2xl rounded-tr-sm bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black">
                      {item.answer}
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                      你
                    </span>
                  </div>
                </li>
              ))}

              {currentQuestion && (
                <li className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                    AI
                  </span>
                  <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-sm text-black shadow-sm dark:bg-zinc-800 dark:text-zinc-50">
                    <span className="mr-1 font-medium text-indigo-500">
                      Q{history.length + 1}.
                    </span>
                    {currentQuestion}
                  </div>
                </li>
              )}

              {isTyping && (
                <li className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                    AI
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm dark:bg-zinc-800">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                  </div>
                </li>
              )}
            </ol>

            {currentQuestion && (
              <div className="flex flex-col gap-2">
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  placeholder="輸入你的回答..."
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answerInput.trim()}
                >
                  {loading && <SpinnerIcon className="h-4 w-4" />}
                  {loading ? "處理中..." : "送出答案"}
                </button>
              </div>
            )}
          </section>
        )}

        {phase === "done" && result && (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 rounded-2xl border border-black/[.06] bg-white p-6 shadow-sm dark:border-white/[.08] dark:bg-zinc-900 sm:p-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                  <ScoreRing score={result.score ?? 0} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-semibold text-black dark:text-zinc-50">
                      {result.score ?? "N/A"}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">/ 100</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    總體評分
                  </span>
                  {result.summary && (
                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {result.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {result.strengths.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircleIcon className="h-4 w-4" />
                      優點
                    </span>
                    <ul className="flex flex-col gap-1 text-sm text-emerald-800 dark:text-emerald-200">
                      {result.strengths.map((s, i) => (
                        <li key={i}>· {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.improvements.length > 0 && (
                  <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/40">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                      <LightbulbIcon className="h-4 w-4" />
                      建議改進
                    </span>
                    <ul className="flex flex-col gap-1 text-sm text-amber-800 dark:text-amber-200">
                      {result.improvements.map((s, i) => (
                        <li key={i}>· {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <ol className="flex flex-col gap-4">
              {history.map((item, idx) => (
                <li key={idx} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-semibold text-white">
                      AI
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2 text-sm text-black shadow-sm dark:bg-zinc-800 dark:text-zinc-50">
                      <span className="mr-1 font-medium text-indigo-500">Q{idx + 1}.</span>
                      {item.question}
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-2">
                    <div className="rounded-2xl rounded-tr-sm bg-black px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-black">
                      {item.answer}
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                      你
                    </span>
                  </div>
                  {result.questionFeedback[idx] && (
                    <div className="ml-9 flex items-start gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
                      <LightbulbIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="mr-1 font-medium">更好的回答方式:</span>
                        {result.questionFeedback[idx]}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <button
              className="self-start rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-white/[.08]"
              onClick={handleRestart}
            >
              重新開始
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
