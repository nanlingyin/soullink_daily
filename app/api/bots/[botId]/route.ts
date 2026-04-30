import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";

type Params = { params: { botId: string } };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({
    where: { id: params.botId, userId: user.id },
    include: {
      schedules: { orderBy: [{ scheduleDate: "desc" }, { startTime: "asc" }], take: 20 },
      posts: { orderBy: { createdAt: "desc" }, take: 12 }
    }
  });

  if (!bot) return jsonError("Bot 不存在", 404);
  return jsonOk({ bot });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const exists = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!exists) return jsonError("Bot 不存在", 404);

  const body = await readJson<Record<string, string | undefined>>(request);
  const bot = await prisma.aiBot.update({
    where: { id: params.botId },
    data: {
      name: body.name || exists.name,
      avatarUrl: body.avatarUrl ?? exists.avatarUrl,
      standingImageUrl: body.standingImageUrl ?? exists.standingImageUrl,
      personaText: body.personaText || exists.personaText,
      speakingStyle: body.speakingStyle ?? exists.speakingStyle,
      personalityTags: body.personalityTags ?? exists.personalityTags,
      worldSetting: body.worldSetting ?? exists.worldSetting,
      relationshipSetting: body.relationshipSetting ?? exists.relationshipSetting,
      visualPrompt: body.visualPrompt ?? exists.visualPrompt,
      negativePrompt: body.negativePrompt ?? exists.negativePrompt,
      schedulePreference: body.schedulePreference ?? exists.schedulePreference
    }
  });

  return jsonOk({ bot });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const exists = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!exists) return jsonError("Bot 不存在", 404);

  await prisma.aiBot.delete({ where: { id: params.botId } });
  return jsonOk({ ok: true });
}
