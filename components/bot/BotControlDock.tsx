"use client";

import { useState } from "react";
import { ChatBox } from "@/components/chat/ChatBox";
import { SchedulePanel } from "@/components/bot/SchedulePanel";

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

export function BotControlDock({ botId, botName, schedules }: { botId: string; botName: string; schedules: Schedule[] }) {
  const [activeTab, setActiveTab] = useState<"chat" | "schedule">("chat");

  const tabClass = (tab: "chat" | "schedule") =>
    `flex-1 rounded-full px-4 py-2 text-sm font-black transition ${
      activeTab === tab ? "bg-zinc-900 text-white shadow-lg" : "bg-white/70 text-zinc-600 hover:bg-white"
    }`;

  return (
    <aside className="min-w-0">
      <div className="lg:hidden">
        <div className="glass-card rounded-[1.5rem] p-2">
          <div className="flex gap-2 rounded-full bg-white/45 p-1">
            <button type="button" onClick={() => setActiveTab("chat")} className={tabClass("chat")}>
              聊天
            </button>
            <button type="button" onClick={() => setActiveTab("schedule")} className={tabClass("schedule")}>
              今日日程 {schedules.length ? `· ${schedules.length}` : ""}
            </button>
          </div>
          <p className="px-3 pb-2 pt-3 text-xs leading-5 text-zinc-500">
            手机端默认展示聊天，日程折叠到标签页里，避免需要一路滚到最下面。
          </p>
        </div>
        <div className="mt-3">
          <div className={activeTab === "chat" ? "block" : "hidden"}>
            <ChatBox botId={botId} botName={botName} layout="mobile-tab" />
          </div>
          <div className={activeTab === "schedule" ? "block" : "hidden"}>
            <SchedulePanel botId={botId} schedules={schedules} layout="mobile-tab" />
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 gap-5 lg:grid lg:grid-cols-2 xl:sticky xl:top-6 xl:h-[calc(100vh-8.5rem)] xl:min-h-[620px] xl:max-h-[860px] xl:grid-cols-1 xl:grid-rows-[minmax(0,0.46fr)_minmax(0,0.54fr)]">
        <div className="min-h-0">
          <SchedulePanel botId={botId} schedules={schedules} layout="dock" />
        </div>
        <div className="min-h-0">
          <ChatBox botId={botId} botName={botName} layout="dock" />
        </div>
      </div>
    </aside>
  );
}