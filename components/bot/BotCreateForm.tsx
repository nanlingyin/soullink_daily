"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  personaText: string;
  speakingStyle: string;
  personalityTags: string;
  worldSetting: string;
  relationshipSetting: string;
  visualPrompt: string;
  schedulePreference: string;
  avatarUrl: string;
  standingImageUrl: string;
};

const initialState: FormState = {
  name: "月见天音",
  personaText: "表面轻微毒舌、实际很关心人的女大学生型 AI 虚拟角色。喜欢咖啡、黄昏散步和写日记。",
  speakingStyle: "简短自然，偶尔吐槽，有一点傲娇，但会认真回应用户。",
  personalityTags: "傲娇,温柔,日常,轻陪伴",
  worldSetting: "现代都市日常，角色生活在一个安静、有咖啡店和图书馆的小城。",
  relationshipSetting: "熟悉的陪伴型伙伴，会把用户当作重要的人。",
  visualPrompt: "anime girl, long lavender hair, blue eyes, soft cardigan, gentle expression, consistent character design",
  schedulePreference: "咖啡店、图书馆、黄昏散步、睡前日记",
  avatarUrl: "",
  standingImageUrl: ""
};

export function BotCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function uploadFile(kind: "avatar" | "standing-image", file?: File) {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);

    const response = await fetch(`/api/upload/${kind}`, {
      method: "POST",
      body: data
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "上传失败");
    update(kind === "avatar" ? "avatarUrl" : "standingImageUrl", result.url);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "创建失败");
      router.push(`/bots/${result.bot.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass-card rounded-[1.75rem] p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">角色名称</span>
            <input className="field" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：月见天音" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">角色人设</span>
            <textarea className="field min-h-32" value={form.personaText} onChange={(event) => update("personaText", event.target.value)} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">说话风格</span>
            <textarea className="field min-h-24" value={form.speakingStyle} onChange={(event) => update("speakingStyle", event.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">性格标签</span>
              <input className="field" value={form.personalityTags} onChange={(event) => update("personalityTags", event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">日程偏好</span>
              <input className="field" value={form.schedulePreference} onChange={(event) => update("schedulePreference", event.target.value)} />
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">世界观设定</span>
            <textarea className="field min-h-24" value={form.worldSetting} onChange={(event) => update("worldSetting", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">与用户关系</span>
            <textarea className="field min-h-20" value={form.relationshipSetting} onChange={(event) => update("relationshipSetting", event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">视觉描述 Prompt</span>
            <textarea className="field min-h-24" value={form.visualPrompt} onChange={(event) => update("visualPrompt", event.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl bg-white/60 p-4">
              <span className="mb-3 block text-sm font-bold">头像上传</span>
              <input type="file" accept="image/*" onChange={(event) => uploadFile("avatar", event.target.files?.[0]).catch((err) => setError(err.message))} />
              {form.avatarUrl ? <img src={form.avatarUrl} alt="avatar" className="mt-3 h-20 w-20 rounded-2xl object-cover" /> : null}
            </label>
            <label className="rounded-2xl bg-white/60 p-4">
              <span className="mb-3 block text-sm font-bold">立绘上传</span>
              <input type="file" accept="image/*" onChange={(event) => uploadFile("standing-image", event.target.files?.[0]).catch((err) => setError(err.message))} />
              {form.standingImageUrl ? <img src={form.standingImageUrl} alt="standing" className="mt-3 h-24 w-20 rounded-2xl object-cover" /> : null}
            </label>
          </div>
        </div>
      </div>

      {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 flex justify-end">
        <button disabled={loading} className="soft-button px-8 py-3 font-bold">
          {loading ? "创建中..." : "创建角色"}
        </button>
      </div>
    </form>
  );
}
