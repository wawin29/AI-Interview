// 強制此 Route Handler 使用 Node.js runtime(而非 Edge runtime)。
export const runtime = "nodejs";

// BYOK(Bring Your Own Key):我們不在伺服器保存任何人的 OpenAI API Key,
// 金鑰完全由前端從瀏覽器 localStorage 讀出,透過這個自訂 header 帶進每一次請求,
// 用完即丟,不會被記錄或儲存在伺服器端。
const API_KEY_HEADER = "x-openai-api-key";

// 題數的上下限,搭配前端的 input[type=number] min/max 使用,避免使用者亂輸入(例如 0 題或 999 題)。
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;
// 如果前端沒有傳 totalQuestions 欄位,預設使用 3 題(相容舊版前端行為)。
const DEFAULT_QUESTIONS = 3;
// 前端「履歷內容」textarea 的長度上限,避免 prompt 過長。
const MAX_RESUME_LENGTH = 8000;
// OpenAI Chat Completions API 的端點網址。
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// 代表「一問一答」的歷史紀錄,每完成一題就會多一筆。
// 前端會把目前為止「已經回答完的」題目都放進 history 陣列,每次請求都整包送給後端(這支 API 是無狀態的,不會在伺服器端保存任何 session)。
interface HistoryItem {
  question: string; // 面試官問的問題
  answer: string; // 求職者的回答
}

// OpenAI Chat Completions API 所需的訊息格式。
// - system: 設定 AI 的角色與規則(只會放一則,在對話最前面)
// - assistant: 代表「AI 說的話」,這裡拿來塞入面試官過去問過的問題
// - user: 代表「使用者說的話」,這裡拿來塞入求職者過去的回答,以及我們對 AI 下達的指令
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 呼叫 OpenAI Chat Completions API,並把回傳的內容解析成 JSON 物件。
 * 這是整支檔案唯一會跟 OpenAI 溝通的地方,不管是「出題」還是「最終評分」都會呼叫這個函式,
 * 差別只在於傳進來的 messages(對話內容)不同。
 *
 * apiKey 是由呼叫端(POST handler)從 request header 取出、驗證過非空之後才傳進來的,
 * 這支函式本身不碰 process.env,確保伺服器完全不需要、也不會使用自己的金鑰。
 */
async function callOpenAI(
  messages: ChatMessage[],
  apiKey: string
): Promise<Record<string, unknown>> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // OpenAI API 使用 Bearer Token 驗證身份。
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // 可透過環境變數 OPENAI_MODEL 覆寫要使用的模型,沒設定就用 gpt-4o-mini(便宜且速度快)。
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      // temperature 越高回答越有變化、越低越穩定保守,0.7 是偏活潑但不失穩定的折衷值。
      temperature: 0.7,
      // 強制模型只能輸出合法 JSON(而不是自然語言),這樣後續 JSON.parse 才會穩定成功。
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw new Error("OpenAI 拒絕了這組 API Key,請確認金鑰是否正確或已過期");
    }
    if (res.status === 429) {
      throw new Error("OpenAI 額度已用盡或請求過於頻繁,請稍後再試或檢查帳戶額度");
    }
    // 其他非 2xx 狀況(例如模型名稱錯誤),把錯誤內容一起丟出方便除錯。
    throw new Error(`OpenAI API 錯誤 (${res.status}): ${text}`);
  }

  const data = await res.json();
  // Chat Completions API 的回傳結構是 { choices: [{ message: { content: "..." } }] },
  // 這裡用 optional chaining 安全地往內取值,避免結構不符時直接噴例外。
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI 回應格式異常");
  }

  try {
    // content 是一段「字串形式的 JSON」,因為我們要求 response_format: json_object,
    // 所以理論上這裡一定解析得出來,但仍用 try/catch 防止模型偶爾出錯。
    return JSON.parse(content);
  } catch {
    throw new Error("OpenAI 回應內容不是有效的 JSON");
  }
}

/**
 * 產生放在對話最前面的 system prompt,用來設定 AI 的角色、面試規則與輸出格式限制。
 * 這段內容在「出題」和「最終評分」兩種情境下都會共用,確保 AI 全程知道自己在扮演面試官、
 * 職缺內容是什麼、總共要問幾題。
 */
function buildSystemPrompt(
  jobDescription: string,
  totalQuestions: number,
  resumeText: string
): string {
  const resumeSection = resumeText
    ? `\n求職者履歷內容:\n${resumeText}\n`
    : "";
  const resumeRule = resumeText
    ? "\n- 求職者提供了履歷,請優先結合履歷中實際提到的專案、經歷與技能來設計問題(例如針對某個專案的細節、技術選擇或成果追問),並同時兼顧職缺描述的需求,讓提問更貼近這位求職者的真實背景。"
    : "";

  return `你是一位資深的招聘面試官,正在針對以下職缺對求職者進行模擬面試。

職缺描述:
${jobDescription}
${resumeSection}
面試規則:
- 總共會問求職者 ${totalQuestions} 個問題。
- 問題需根據職缺描述的技能與職責設計,具備鑑別度,可依求職者先前的回答追問或延伸,也可以換一個相關主題。${resumeRule}
- 所有輸出都必須使用繁體中文。
- 你的回覆只能是指定格式的 JSON 物件,不能包含 JSON 以外的任何文字、註解或 Markdown 標記。`;
}

/**
 * 檢查前端傳來的 history 是否符合預期格式:
 * 必須是陣列,且每一筆都要有非空字串的 question 與 answer。
 * 這是一個 TypeScript type guard(回傳型別是 `history is HistoryItem[]`),
 * 通過檢查後,TypeScript 會自動把 history 的型別收斂成 HistoryItem[],後面就能安心存取 .question / .answer。
 */
function isValidHistory(history: unknown): history is HistoryItem[] {
  if (!Array.isArray(history)) return false;
  return history.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as HistoryItem).question === "string" &&
      typeof (item as HistoryItem).answer === "string" &&
      (item as HistoryItem).answer.trim().length > 0
  );
}

/**
 * POST /api/interview
 *
 * 這支 API 是整個模擬面試功能的大腦,採「無狀態」設計:
 * 前端每次呼叫都要把「職缺描述」「題數」「目前為止的問答紀錄」整包傳過來,
 * 伺服器不會記住任何東西,單純根據這次傳來的資料決定「下一步該做什麼」。
 *
 * BYOK:呼叫者也必須透過 x-openai-api-key header 帶上自己的 OpenAI API Key,
 * 這支 API 只負責當下轉發給 OpenAI,不會儲存這組金鑰。
 *
 * 判斷邏輯很單純:
 * - 如果 history 的題數還沒到達 totalQuestions → 出下一題
 * - 如果 history 的題數已經到達 totalQuestions → 全部問完了,進行最終評分
 */
export async function POST(request: Request) {
  // Step 1: 解析並驗證 request body 是否為合法 JSON。
  let body: {
    jobDescription?: unknown;
    history?: unknown;
    totalQuestions?: unknown;
    resumeText?: unknown;
    useResume?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "請提供有效的 JSON 內容" }, { status: 400 });
  }

  // Step 1.5: 取出使用者從瀏覽器帶來的 OpenAI API Key(BYOK)。
  // 這支 API 完全不使用伺服器自己的金鑰,沒帶金鑰或格式不對就直接拒絕。
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim() ?? "";
  if (!apiKey) {
    return Response.json(
      { error: "請先在右上角設定你的 OpenAI API Key" },
      { status: 401 }
    );
  }
  if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
    return Response.json(
      { error: "OpenAI API Key 格式不正確,請確認後重新輸入" },
      { status: 401 }
    );
  }

  // Step 2: 驗證職缺描述 —— 必須存在、去除頭尾空白後不能是空字串、且長度有上限(避免 prompt 過長浪費 token / 被濫用)。
  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
  if (!jobDescription) {
    return Response.json({ error: "請提供職缺描述" }, { status: 400 });
  }
  if (jobDescription.length > 4000) {
    return Response.json({ error: "職缺描述過長,請縮短至 4000 字以內" }, { status: 400 });
  }

  // Step 3: 驗證題數 —— 沒傳就用預設值 3,傳了就要是 MIN_QUESTIONS ~ MAX_QUESTIONS 之間的整數。
  const rawTotalQuestions = body.totalQuestions;
  const totalQuestions =
    rawTotalQuestions === undefined ? DEFAULT_QUESTIONS : Number(rawTotalQuestions);
  if (
    !Number.isInteger(totalQuestions) ||
    totalQuestions < MIN_QUESTIONS ||
    totalQuestions > MAX_QUESTIONS
  ) {
    return Response.json(
      { error: `題數必須為 ${MIN_QUESTIONS} 到 ${MAX_QUESTIONS} 之間的整數` },
      { status: 400 }
    );
  }

  // Step 4: 驗證 history —— 格式要正確,且題數不能超過使用者設定的 totalQuestions(避免異常請求)。
  const history = body.history ?? [];
  if (!isValidHistory(history)) {
    return Response.json({ error: "對話紀錄格式錯誤" }, { status: 400 });
  }
  if (history.length > totalQuestions) {
    return Response.json({ error: "對話紀錄超出預期的題數" }, { status: 400 });
  }

  // Step 4.5: 驗證履歷相關欄位(選填)。
  // useResume 代表使用者是否勾選「依履歷出題」;若勾選了就必須要有履歷文字內容。
  const useResume = body.useResume === true;
  const rawResumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
  if (useResume && !rawResumeText) {
    return Response.json(
      { error: "請先上傳履歷,或取消勾選「依履歷出題」" },
      { status: 400 }
    );
  }
  if (rawResumeText.length > MAX_RESUME_LENGTH) {
    return Response.json(
      { error: `履歷內容過長,請縮短至 ${MAX_RESUME_LENGTH} 字以內` },
      { status: 400 }
    );
  }
  // 只有在使用者勾選「依履歷出題」時,才把履歷內容放進 prompt。
  const resumeText = useResume ? rawResumeText : "";

  // Step 5: 準備要送給 OpenAI 的對話內容。
  // systemPrompt 放在最前面設定角色與規則;
  // conversation 則是把 history 攤平成「assistant 問、user 答」交錯的訊息陣列,
  // 這樣 AI 在「出下一題」或「最終評分」時,都能看到完整的對話上下文(才能追問、才能評分)。
  const systemPrompt = buildSystemPrompt(jobDescription, totalQuestions, resumeText);
  const conversation: ChatMessage[] = history.flatMap((item) => [
    { role: "assistant", content: item.question },
    { role: "user", content: item.answer },
  ]);

  try {
    // ===== 情境 A:已經回答完所有題目 → 進行最終評分 =====
    if (history.length >= totalQuestions) {
      // 用一段指令告訴 AI:所有題目都答完了,請根據整體表現給分、給建議,
      // 並且針對「每一題」個別提供一個更好的回答示範(questionFeedback)。
      const instruction = `求職者已完成全部 ${totalQuestions} 題的回答。請根據求職者在這些問題中的回答品質、與職缺的契合度、表達能力,給予整體評分與具體建議。另外,請針對「每一題」個別提供一個更好的回答示範或方向,協助求職者了解如何回答得更完整、更有說服力。只回傳 JSON,格式為:
{"score": 0到100之間的整數, "summary": "整體評語,2到4句話", "strengths": ["優點1", "優點2"], "improvements": ["建議1", "建議2"], "questionFeedback": ["第1題的更好回答方式建議", "第2題的更好回答方式建議", "..."]}
"questionFeedback" 陣列的長度必須剛好是 ${totalQuestions},且順序需對應第 1 題到第 ${totalQuestions} 題。`;

      const result = await callOpenAI(
        [
          { role: "system", content: systemPrompt },
          ...conversation, // 完整的三題(或 N 題)問答紀錄,讓 AI 有足夠上下文評分
          { role: "user", content: instruction }, // 最後才下達「請評分」的指令
        ],
        apiKey
      );

      // 以下是「防禦性解析」:AI 回傳的 JSON 理論上會符合格式,
      // 但仍逐一檢查型別、把分數限制在 0-100 之間、陣列欄位缺漏時給空陣列,
      // 避免因為模型偶爾輸出異常格式而導致前端畫面壞掉或整支 API 噴錯。
      const score = Number(result.score);
      const questionFeedback = Array.isArray(result.questionFeedback)
        ? result.questionFeedback.filter((item): item is string => typeof item === "string")
        : [];

      return Response.json({
        type: "result", // 前端會用這個欄位判斷「這是最終結果」還是「這是下一題」
        score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
        summary: typeof result.summary === "string" ? result.summary : "",
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        improvements: Array.isArray(result.improvements) ? result.improvements : [],
        questionFeedback,
      });
    }

    // ===== 情境 B:題目還沒問完 → 出下一題 =====
    const questionNumber = history.length + 1; // 目前是第幾題(1-based)
    const instruction = `請提出第 ${questionNumber} 題面試問題(共 ${totalQuestions} 題)。${
      history.length > 0
        ? "可以針對求職者上一題的回答追問,也可以換一個與職缺相關的新主題。" // 已經有前情提要,可以追問
        : "這是第一題,請從職缺描述中最重要的技能或職責切入。" // 第一題還沒有任何回答可以參考
    }只回傳 JSON,格式為:{"question": "問題內容"}`;

    const result = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        ...conversation, // 之前已經問過、答過的內容(第一次呼叫時是空陣列)
        { role: "user", content: instruction },
      ],
      apiKey
    );

    if (typeof result.question !== "string" || !result.question.trim()) {
      // 防止模型漏給 question 欄位或給空字串,直接視為錯誤讓前端顯示錯誤訊息。
      throw new Error("OpenAI 未回傳有效的問題內容");
    }

    return Response.json({
      type: "question", // 前端會用這個欄位判斷「這是下一題」
      question: result.question,
      questionNumber,
      totalQuestions, // 一併回傳讓前端可以顯示「第 X / Y 題」的進度
    });
  } catch (error) {
    // 統一的錯誤處理:不管是 callOpenAI 內部丟出的錯誤,還是上面手動 throw 的錯誤,
    // 都會在這裡被攔截、印到伺服器 log,並回傳 500 給前端顯示錯誤訊息。
    console.error("[/api/interview]", error);
    const message = error instanceof Error ? error.message : "未知錯誤";
    return Response.json({ error: message }, { status: 500 });
  }
}
