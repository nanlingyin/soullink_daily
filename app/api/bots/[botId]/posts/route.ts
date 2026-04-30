import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { botId: string } };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!bot) return jsonError("Bot 不存在", 404);

  const posts = await prisma.botPost.findMany({
    where: { botId: bot.id, userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      bot: true,
      comments: { orderBy: { createdAt: "asc" } },
      likes: { where: { userId: user.id }, select: { id: true } }
    }
  });

  return jsonOk({ posts });
}
