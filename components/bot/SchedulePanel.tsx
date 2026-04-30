"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Schedule = {
  id: string;
  startTime: string;
  title: string;
  scene: string;
  mood: string;
  postStyle?: string | null;
  status: string;
  posts?: { id: string }[];
};

type SchedulePanelLayout = "normal" | "dock" | "mobile-tab";

export function SchedulePanel({ botId, schedules, layout = "normal" }: { botId: string; schedules: Schedule[]; layout?: SchedulePanelLayout }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const panelSizeClass = {
    normal: "min-h-[420px]",
    dock: "h-full min-h-0",
    "mobile-tab": "h-[min(62vh,460px)] min-h-[320px]"
  }[layout];

  const compact = layout !== "normal";

  async function requestAction(url: string, key: string) {
    setBusy(key);
    setError("");
    try {
      const response = await fetch(url, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "操作失败");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={`glass-card flex flex-col rounded-[1.75rem] p-4 sm:p-5 ${panelSizeClass}`}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${compact ? "mb-3" : "mb-5"}`}>
        <div>
          <h3 className="text-xl font-black">今日日程</h3>
          <p className="mt-1 text-sm text-zinc-500">{compact ? "日程列表内部可滚动" : "让 Bot 先拥有自己的一天"}</p>
        </div>
        <button disabled={Boolean(busy)} onClick={() => requestAction(`/api/bots/${botId}/schedules/generate`, "generate")} className="soft-button inline-flex justify-center px-4 py-2 text-sm font-bold sm:shrink-0">
          {busy === "generate" ? "生成中" : "生成日程"}
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <div className="soft-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {schedules.length === 0 ? (
          <div className="flex h-full min-h-40 items-center justify-center rounded-3xl bg-white/60 p-5 text-center text-sm text-zinc-500">还没有日程，点击“生成日程”开始。</div>
        ) : (
          schedules.map((schedule) => (
            <article key={schedule.id} className={`rounded-3xl border border-white/70 bg-white/68 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/82 ${compact ? "p-3" : "p-4"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-purple-700">{schedule.startTime}</p>
                  <h4 className="mt-1 font-black">{schedule.title}</h4>
                  <p className={`mt-2 text-sm leading-6 text-zinc-600 ${compact ? "line-clamp-2" : ""}`}>{schedule.scene}</p>
                  <p className="mt-1 text-xs text-zinc-500">心情：{schedule.mood} · {schedule.status}</p>
                </div>
                <button
                  disabled={Boolean(busy) || schedule.status === "posted"}
                  onClick={() => requestAction(`/api/schedules/${schedule.id}/run`, schedule.id)}
                  className="inline-flex justify-center rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-200 disabled:opacity-50 sm:shrink-0"
                >
                  {busy === schedule.id ? "生成中" : schedule.status === "posted" ? "已发布" : "生成动态"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
