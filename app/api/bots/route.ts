import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  const bots = await prisma.aiBot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { schedules: true, posts: true }
      }
    }
  });

  return jsonOk({ bots });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await readJson<{
    name?: string;
    avatarUrl?: string;
    standingImageUrl?: string;
    personaText?: string;
    speakingStyle?: string;
    personalityTags?: string;
    worldSetting?: string;
    relationshipSetting?: string;
    visualPrompt?: string;
    negativePrompt?: string;
    schedulePreference?: string;
  }>(request);

  if (!body.name?.trim()) {
    return jsonError("请填写角色名称");
  }

  const bot = await prisma.aiBot.create({
    data: {
      userId: user.id,
      name: body.name.trim(),
      avatarUrl: body.avatarUrl || null,
      standingImageUrl: body.standingImageUrl || null,
      personaText: body.personaText?.trim() || "一个温柔、有生活感的 AI 虚拟角色。",
      speakingStyle: body.speakingStyle || null,
      personalityTags: body.personalityTags || null,
      worldSetting: body.worldSetting || null,
      relationshipSetting: body.relationshipSetting || null,
      visualPrompt: body.visualPrompt || null,
      negativePrompt: body.negativePrompt || null,
      schedulePreference: body.schedulePreference || null
    }
  });

  return jsonOk({ bot }, { status: 201 });
}
