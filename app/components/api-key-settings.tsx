"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  OPEN_API_KEY_SETTINGS_EVENT,
  getStoredApiKey,
  looksLikeOpenAIKey,
  setStoredApiKey,
  subscribeToApiKeyChanges,
} from "../lib/openai-key";
import { CloseIcon, EyeIcon, EyeOffIcon, GearIcon, KeyIcon } from "./icons";

export function ApiKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showPlainText, setShowPlainText] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // 是否已經有金鑰,交給 useSyncExternalStore 訂閱這個「瀏覽器外部狀態」,
  // 這樣就不用在 useEffect 裡手動 setState 來同步。
  const hasKey = useSyncExternalStore(
    subscribeToApiKeyChanges,
    () => Boolean(getStoredApiKey()),
    () => false
  );

  // 訂閱「請求打開設定視窗」事件,讓其他元件(例如面試頁面)可以在使用者
  // 還沒設定金鑰就要開始面試時,直接跳出這個視窗。setState 發生在事件 callback 裡,
  // 而不是 effect body 本身,符合 React 建議的訂閱寫法。
  useEffect(() => {
    function openHandler() {
      setInputValue(getStoredApiKey());
      setFormError(null);
      setSavedMessage(null);
      setIsOpen(true);
    }
    window.addEventListener(OPEN_API_KEY_SETTINGS_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_API_KEY_SETTINGS_EVENT, openHandler);
  }, []);

  // 按 Esc 可以關閉視窗。
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function openModal() {
    setInputValue(getStoredApiKey());
    setFormError(null);
    setSavedMessage(null);
    setIsOpen(true);
  }

  function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setFormError("請輸入你的 OpenAI API Key");
      return;
    }
    if (!looksLikeOpenAIKey(trimmed)) {
      setFormError("看起來不是有效的 OpenAI API Key 格式(通常以 sk- 開頭)");
      return;
    }
    setStoredApiKey(trimmed);
    setFormError(null);
    setSavedMessage("已儲存到這個瀏覽器,之後開始面試會自動使用這組金鑰。");
  }

  function handleClear() {
    setStoredApiKey("");
    setInputValue("");
    setFormError(null);
    setSavedMessage("已清除瀏覽器中儲存的金鑰。");
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="設定 OpenAI API Key"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[.08] text-zinc-600 transition-colors hover:bg-black/[.04] dark:border-white/[.12] dark:text-zinc-300 dark:hover:bg-white/[.08]"
      >
        <GearIcon className="h-4.5 w-4.5" />
        <span
          className={`absolute right-0.5 top-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-black ${
            hasKey ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          // 這個彈窗被 createPortal 直接掛到 document.body,而不是留在 header 底下。
          // 原因:header 有 backdrop-blur-md(backdrop-filter),CSS 規定 filter/backdrop-filter
          // 會替 fixed 定位的子孫元素建立新的「包含區塊」,導致 `fixed inset-0` 只會撐滿 header 的
          // 64px 高度,而不是整個視窗。用 portal 掛到 body 可以完全跳脫這個問題。
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 backdrop-blur-sm sm:items-center"
            onClick={() => setIsOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="設定 OpenAI API Key"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-6 shadow-2xl dark:border-white/[.1] dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <KeyIcon className="h-4.5 w-4.5" />
                  </span>
                  <h2 className="text-base font-semibold text-black dark:text-zinc-50">
                    設定你的 OpenAI API Key
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="關閉"
                  className="text-zinc-400 transition-colors hover:text-black dark:hover:text-zinc-50"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Interviewly 採用 BYOK(Bring Your Own Key)模式:金鑰只會儲存在「這台瀏覽器」的
                localStorage,並在你使用模擬面試時直接由瀏覽器帶給我們的伺服器轉發給 OpenAI,我們不會把金鑰存到資料庫或任何地方。
              </p>

              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  OpenAI API Key
                </span>
                <div className="relative">
                  <input
                    type={showPlainText ? "text" : "password"}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setFormError(null);
                      setSavedMessage(null);
                    }}
                    placeholder="sk-..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 font-mono text-sm text-black outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlainText((v) => !v)}
                    aria-label={showPlainText ? "隱藏金鑰" : "顯示金鑰"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-zinc-50"
                  >
                    {showPlainText ? (
                      <EyeOffIcon className="h-4.5 w-4.5" />
                    ) : (
                      <EyeIcon className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </label>

              {formError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formError}</p>
              )}
              {savedMessage && (
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                  {savedMessage}
                </p>
              )}

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                還沒有金鑰?前往 OpenAI 官網建立 →
              </a>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasKey && !inputValue}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.04] disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-white/[.08]"
                >
                  清除金鑰
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
