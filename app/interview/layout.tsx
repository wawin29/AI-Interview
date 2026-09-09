import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "開始模擬面試 · Interviewly",
  description: "貼上職缺描述,立即開始 AI 模擬面試,結束後取得評分與回答建議。",
};

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return children;
}
