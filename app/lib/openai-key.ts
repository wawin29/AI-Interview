// BYOK(Bring Your Own Key)機制:使用者的 OpenAI API Key 只存在瀏覽器的 localStorage,
// 不會經過我們的伺服器儲存,也不會寫進任何環境變數。這個檔案集中管理讀寫邏輯與跨元件同步用的事件。

const STORAGE_KEY = "interviewly:openai-api-key";

// 當金鑰被儲存/清除時會 dispatch 這個事件,讓同一頁面上的其他元件(例如 header 上的狀態指示、
// 面試頁面)可以即時更新,不需要重新整理頁面。
export const OPENAI_KEY_CHANGED_EVENT = "interviewly:openai-api-key-changed";

// 由「面試頁面」dispatch 這個事件,通知 header 上的設定按鈕自動打開設定視窗
// (例如使用者還沒設定金鑰就按下「開始模擬面試」時)。
export const OPEN_API_KEY_SETTINGS_EVENT = "interviewly:open-api-key-settings";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    // 部分瀏覽器(例如無痕模式)可能會封鎖 localStorage 存取,安全地回傳空字串即可。
    return "";
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 忽略寫入失敗(例如儲存空間已滿或被封鎖)。
  } finally {
    window.dispatchEvent(new Event(OPENAI_KEY_CHANGED_EVENT));
  }
}

export function requestOpenApiKeySettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_API_KEY_SETTINGS_EVENT));
}

// 給 useSyncExternalStore 使用:訂閱「金鑰變更」事件(包含跨分頁的 storage 事件),
// 讓元件可以用 React 建議的方式讀取這種「瀏覽器外部狀態」,而不是在 useEffect 裡手動 setState。
export function subscribeToApiKeyChanges(callback: () => void): () => void {
  window.addEventListener(OPENAI_KEY_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(OPENAI_KEY_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// SSR 階段(伺服器沒有 localStorage)一律回傳空字串,交給瀏覽器端 hydrate 後再讀出真正的值。
export function getApiKeyServerSnapshot(): string {
  return "";
}

// 簡單檢查格式是否「看起來」像一組 OpenAI API Key,並非嚴格驗證(實際是否有效仍要靠呼叫 API 才能確認)。
export function looksLikeOpenAIKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.startsWith("sk-") && trimmed.length >= 20;
}
