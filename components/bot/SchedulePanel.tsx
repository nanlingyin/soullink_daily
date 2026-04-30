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

export function SchedulePanel({ botId, schedules }: { botId: string; schedules: Schedule[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    <section className="glass-card rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">今日日程</h3>
          <p className="mt-1 text-sm text-zinc-500">让 Bot 先拥有自己的一天</p>
        </div>
        <button disabled={Boolean(busy)} onClick={() => requestAction(`/api/bots/${botId}/schedules/generate`, "generate")} className="soft-button px-4 py-2 text-sm font-bold">
          {busy === "generate" ? "生成中" : "生成日程"}
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="rounded-3xl bg-white/60 p-5 text-sm text-zinc-500">还没有日程，点击“生成日程”开始。</div>
        ) : (
          schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-3xl bg-white/68 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-purple-700">{schedule.startTime}</p>
                  <h4 className="mt-1 font-black">{schedule.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{schedule.scene}</p>
                  <p className="mt-1 text-xs text-zinc-500">心情：{schedule.mood} · {schedule.status}</p>
                </div>
                <button
                  disabled={Boolean(busy) || schedule.status === "posted"}
                  onClick={() => requestAction(`/api/schedules/${schedule.id}/run`, schedule.id)}
                  className="rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-700 disabled:opacity-50"
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
