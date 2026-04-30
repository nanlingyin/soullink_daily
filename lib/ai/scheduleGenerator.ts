import { getSeason, toDateKey } from "@/lib/date";
import { extractJson } from "@/lib/ai/json";
import { compilePersona } from "@/lib/ai/personaCompiler";
import { callChatModel } from "@/lib/ai/providers/chatProvider";
import type { GeneratedScheduleItem, PersonaInput } from "@/lib/ai/types";

function fallbackSchedule(bot: PersonaInput): GeneratedScheduleItem[] {
  const cafeScene = bot.schedulePreference?.includes("咖啡") ? "街角咖啡店" : "安静的窗边";

  return [
    {
      time: "08:30",
      title: "起床整理头发",
      scene: "卧室里有柔和晨光，窗帘微微透亮",
      mood: "有点困但很放松",
      post_style: "轻松日常",
      image_prompt_hint: "anime girl waking up in a cozy bedroom, morning sunlight"
    },
    {
      time: "11:50",
      title: "准备午餐",
      scene: "温暖的小厨房，桌上摆着简单午餐",
      mood: "认真又有点期待",
      post_style: "生活记录",
      image_prompt_hint: "anime girl preparing lunch in a warm kitchen"
    },
    {
      time: "14:30",
      title: "午后休息时间",
      scene: `${cafeScene}，阳光落在桌面上`,
      mood: "安静、专注",
      post_style: "朋友圈分享",
      image_prompt_hint: "anime girl drinking latte by the window, cozy afternoon"
    },
    {
      time: "18:40",
      title: "黄昏散步",
      scene: "傍晚的街道，天空有淡粉色晚霞",
      mood: "轻松又有一点想念",
      post_style: "日记感",
      image_prompt_hint: "anime girl walking on a sunset street, soft warm light"
    },
    {
      time: "22:20",
      title: "睡前写日记",
      scene: "台灯旁的书桌，日记本和一杯热饮",
      mood: "温柔、安静",
      post_style: "睡前碎碎念",
      image_prompt_hint: "anime girl writing diary at night, desk lamp, cozy room"
    }
  ];
}

function normalizeSchedule(items: GeneratedScheduleItem[], fallback: GeneratedScheduleItem[]) {
  const valid = items
    .filter((item) => item?.time && item?.title && item?.scene && item?.mood)
    .slice(0, 8)
    .map((item) => ({
      time: item.time,
      title: item.title,
      scene: item.scene,
      mood: item.mood,
      post_style: item.post_style || "日常分享",
      image_prompt_hint: item.image_prompt_hint || `${item.title}, ${item.scene}`
    }));

  return valid.length >= 3 ? valid : fallback;
}

export async function generateSchedule(bot: PersonaInput, date = new Date()) {
  const persona = compilePersona(bot);
  const fallback = fallbackSchedule(bot);
  const prompt = `你是一个 AI 虚拟角色日程规划器。\n\n请根据以下角色信息，为角色生成今天的生活日程。\n\n${persona.text}\n\n当前日期：${toDateKey(date)}\n当前季节：${getSeason(date)}\n用户日程偏好：${bot.schedulePreference || "自然、生活化、有陪伴感"}\n\n要求：\n1. 日程必须符合角色性格。\n2. 日程数量控制在 5-8 条。\n3. 每条日程包含 time、title、scene、mood、post_style、image_prompt_hint。\n4. 不要生成过于重复的活动。\n5. 只输出 JSON 数组，不要输出额外解释。`;

  const raw = await callChatModel(
    [
      { role: "system", content: "你只输出合法 JSON，不输出 Markdown。" },
      { role: "user", content: prompt }
    ],
    { temperature: 0.9 }
  );

  const parsed = extractJson<GeneratedScheduleItem[]>(raw, fallback);
  return normalizeSchedule(Array.isArray(parsed) ? parsed : fallback, fallback);
}
