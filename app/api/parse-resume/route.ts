import { PDFParse } from "pdf-parse";

// 這支 API 只做「檔案 → 純文字」的轉換,不會呼叫 OpenAI、不需要 API Key,
// 也不會把檔案內容儲存在伺服器上(處理完就丟)。抽出來的文字會由前端暫存,
// 之後隨面試請求一起送到 /api/interview。
export const runtime = "nodejs";

// 履歷檔案大小上限(5MB),避免使用者上傳過大的檔案拖垮伺服器或浪費 token。
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// 抽出來的履歷文字最多保留的字元數,超過就截斷(避免 prompt 過長)。
const MAX_TEXT_LENGTH = 8000;

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx + 1).toLowerCase();
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "請提供有效的檔案內容" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "請選擇要上傳的履歷檔案" }, { status: 400 });
  }

  if (file.size === 0) {
    return Response.json({ error: "檔案內容是空的,請重新選擇" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "檔案大小不能超過 5MB" }, { status: 400 });
  }

  const extension = getExtension(file.name);
  if (extension !== "pdf" && extension !== "txt") {
    return Response.json(
      { error: "目前只支援 PDF 或 TXT 格式的履歷檔案" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (extension === "pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else {
      text = buffer.toString("utf-8");
    }

    text = text.replace(/\r\n/g, "\n").trim();
    if (!text) {
      return Response.json(
        { error: "無法從這份檔案中擷取到文字內容,請確認檔案是否正確" },
        { status: 400 }
      );
    }

    const truncated = text.length > MAX_TEXT_LENGTH;
    if (truncated) {
      text = text.slice(0, MAX_TEXT_LENGTH);
    }

    return Response.json({ text, truncated });
  } catch (error) {
    console.error("[/api/parse-resume]", error);
    return Response.json(
      { error: "解析履歷檔案時發生錯誤,請確認檔案是否損毀" },
      { status: 500 }
    );
  }
}
