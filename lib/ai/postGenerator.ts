import { compilePersona } from "@/lib/ai/personaCompiler";
import { callChatModel } from "@/lib/ai/providers/chatProvider";
import { extractJson } from "@/lib/ai/json";
import type { GeneratedPostContent, PersonaInput } from "@/lib/ai/types";

type ScheduleLike = {
  title: string;
  scene: string;
  mood: string;
  imagePromptHint?: string | null;
  postStyle?: string | null;
};

type RecentPostLike = {
  caption: string;
  scene?: string | null;
};

function hasStandingReference(bot: PersonaInput) {
  return Boolean(bot.standingImageUrl?.trim());
}

function buildReferenceInstruction(bot: PersonaInput) {
  if (!hasStandingReference(bot)) {
    return "No reference image is provided. Rely on the character visual description only and keep the design consistent.";
  }

  return [
    "Use the provided standing character reference image as the primary source of truth for the character identity",
    "preserve the same face, hairstyle, hair color, eye style, outfit silhouette, body proportions, and overall temperament",
    "do not redesign the character, do not change the character's identity, and only adapt pose, expression, lighting, camera angle, and scene to the current post"
  ].join(", ");
}

function buildFallbackImagePrompt(personaVisualPrompt: string, schedule: ScheduleLike, negativePrompt: string, referenceInstruction: string) {
  return [
    `REFERENCE: ${referenceInstruction}`,
    `CHARACTER: ${personaVisualPrompt}`,
    `SCENE: ${schedule.imagePromptHint || schedule.title}, ${schedule.scene}`,
    `MOOD_AND_ACTION: ${schedule.mood}, natural daily-life pose, in-character expression`,
    "STYLE_AND_CAMERA: anime illustration, soft light, detailed background, cinematic composition, high consistency character design",
    `NEGATIVE: ${negativePrompt}`
  ].join("; ");
}

function ensureReferenceInstruction(imagePrompt: string, referenceInstruction: string, shouldUseReference: boolean) {
  const trimmed = imagePrompt.trim();
  if (!shouldUseReference) return trimmed;

  const mentionsReference = /reference|provided image|source of truth|same face|character identity|standing character/i.test(trimmed);
  if (mentionsReference) return trimmed;

  return `REFERENCE: ${referenceInstruction}; ${trimmed}`;
}

export async function generatePostContent(bot: PersonaInput, schedule: ScheduleLike, recentPosts: RecentPostLike[] = []) {
  const persona = compilePersona(bot);
  const shouldUseStandingReference = hasStandingReference(bot);
  const referenceInstruction = buildReferenceInstruction(bot);
  const fallback: GeneratedPostContent = {
    caption: `${schedule.title}。${schedule.scene}，感觉今天也在一点点认真生活。`,
    image_prompt: buildFallbackImagePrompt(persona.visualPrompt, schedule, persona.negativePrompt, referenceInstruction),
    emotion: schedule.mood,
    comment_reply_style: "自然、短句、带一点亲近感"
  };

  const prompt = `你是一个 AI Bot 的动态生成器。\n\n请根据角色人设和当前日程，生成一条类似朋友圈的动态内容，并生成适合图像生成模型的英文图片提示词。\n\n${persona.text}\n\n当前日程：${schedule.title}\n当前场景：${schedule.scene}\n当前心情：${schedule.mood}\n动态风格：${schedule.postStyle || "日常分享"}\n最近动态：${recentPosts.map((post) => `${post.caption} / ${post.scene || ""}`).join("；") || "暂无"}\n是否提供角色立绘参考图：${shouldUseStandingReference ? "是，图像生成接口会把 standingImageUrl 作为参考图输入" : "否"}\n\n要求：\n1. 配文要像角色自己发的朋友圈。\n2. 语气必须符合角色人设。\n3. image_prompt 必须使用英文。\n4. image_prompt 必须优先表达角色一致性，再表达场景。\n5. 如果提供了角色立绘参考图，image_prompt 必须明确写出：以 provided standing character reference image / reference image 为角色身份和外观的主要依据，保持同一张脸、发型、发色、眼睛、服装轮廓、身形比例和整体气质，不要重新设计角色；只改变姿势、表情、光影、构图和场景。\n6. 如果没有提供角色立绘参考图，image_prompt 则根据视觉形象描述保持角色设计一致。\n7. image_prompt 必须包含场景、动作、表情、光影、构图。\n8. 避免和最近动态重复。\n9. 只输出 JSON。\n\nimage_prompt 结构要求：\n- REFERENCE: ${referenceInstruction}\n- CHARACTER: 角色外观描述，必须与角色人设一致\n- SCENE: 当前日程和场景\n- MOOD_AND_ACTION: 当前心情、动作、表情\n- STYLE_AND_CAMERA: 画风、光影、镜头、构图\n- NEGATIVE: ${persona.negativePrompt}\n\n输出格式：\n{\n  "caption": "",\n  "image_prompt": "REFERENCE: ...; CHARACTER: ...; SCENE: ...; MOOD_AND_ACTION: ...; STYLE_AND_CAMERA: ...; NEGATIVE: ...",\n  "emotion": "",\n  "comment_reply_style": ""\n}`;

  const raw = await callChatModel(
    [
      { role: "system", content: "你只输出合法 JSON，不输出 Markdown。" },
      { role: "user", content: prompt }
    ],
    { temperature: 0.85 }
  );

  const parsed = extractJson<GeneratedPostContent>(raw, fallback);
  return {
    caption: parsed.caption || fallback.caption,
    image_prompt: ensureReferenceInstruction(parsed.image_prompt || fallback.image_prompt, referenceInstruction, shouldUseStandingReference),
    emotion: parsed.emotion || fallback.emotion,
    comment_reply_style: parsed.comment_reply_style || fallback.comment_reply_style
  };
}
