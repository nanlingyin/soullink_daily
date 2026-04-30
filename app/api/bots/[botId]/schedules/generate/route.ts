import { getCurrentUser } from "@/lib/auth";
import { generateSchedule } from "@/lib/ai/scheduleGenerator";
import { toDateKey } from "@/lib/date";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { botId: string } };

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!bot) return jsonError("Bot 不存在", 404);

  const today = toDateKey();
  const items = await generateSchedule(bot);

  await prisma.botSchedule.deleteMany({
    where: {
      botId: bot.id,
      scheduleDate: today,
      status: { in: ["pending", "failed", "cancelled"] }
    }
  });

  const schedules = await prisma.$transaction(
    items.map((item, index) =>
      prisma.botSchedule.create({
        data: {
          botId: bot.id,
          scheduleDate: today,
          startTime: item.time,
          title: item.title,
          scene: item.scene,
          mood: item.mood,
          postStyle: item.post_style || "日常分享",
          imagePromptHint: item.image_prompt_hint || null,
          sortOrder: index,
          status: "pending"
        }
      })
    )
  );

  return jsonOk({ schedules });
}
