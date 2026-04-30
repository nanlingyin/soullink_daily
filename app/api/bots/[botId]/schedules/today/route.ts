import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { botId: string } };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!bot) return jsonError("Bot 不存在", 404);

  const schedules = await prisma.botSchedule.findMany({
    where: { botId: bot.id, scheduleDate: toDateKey() },
    orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    include: { posts: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return jsonOk({ schedules });
}
