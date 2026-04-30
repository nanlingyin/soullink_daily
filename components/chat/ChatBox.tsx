"use client";

import { FormEvent, useState } from "react";

type LocalMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ChatBox({ botId, botName }: { botId: string; botName: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([
    { role: "assistant", content: `我在哦。今天想先看看我的日程，还是陪我聊一会儿？` }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;

    setMessages((previous) => [...previous, { role: "user", content: value }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, sessionId, message: value })
      });
      const result = await response.json();
      if (result.sessionId) setSessionId(result.sessionId);
      setMessages((previous) => [...previous, { role: "assistant", content: result.reply || "嗯……我刚刚有点走神了，再说一次？" }]);
    } catch {
      setMessages((previous) => [...previous, { role: "assistant", content: "网络好像有点不稳定，但我还在。" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card rounded-[1.75rem] p-5">
      <h3 className="text-xl font-black">和 {botName} 聊天</h3>
      <p className="mt-1 text-sm text-zinc-500">聊天会读取今日日程和最近动态</p>
      <div className="mt-5 max-h-96 space-y-3 overflow-y-auto rounded-3xl bg-white/50 p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-purple-500 text-white" : "bg-white text-zinc-700"}`}>
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input className="field py-2" value={input} onChange={(event) => setInput(event.target.value)} placeholder="问问她今天做了什么..." />
        <button disabled={busy} className="soft-button shrink-0 px-5 py-2 text-sm font-bold">
          {busy ? "..." : "发送"}
        </button>
      </form>
    </section>
  );
}
