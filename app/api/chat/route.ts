import { generateChatReply } from "@/lib/ai/chatResponder";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await readJson<{ botId?: string; sessionId?: string; message?: string }>(request);
  const message = body.message?.trim();

  if (!body.botId) return jsonError("缺少 botId");
  if (!message) return jsonError("消息不能为空");

  const bot = await prisma.aiBot.findFirst({ where: { id: body.botId, userId: user.id } });
  if (!bot) return jsonError("Bot 不存在", 404);

  let session = body.sessionId
    ? await prisma.chatSession.findFirst({ where: { id: body.sessionId, userId: user.id, botId: bot.id } })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        botId: bot.id,
        title: message.slice(0, 18)
      }
    });
  }

  const [schedules, recentPosts, history] = await Promise.all([
    prisma.botSchedule.findMany({
      where: { botId: bot.id, scheduleDate: toDateKey() },
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }]
    }),
    prisma.botPost.findMany({
      where: { botId: bot.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { caption: true, scene: true, mood: true }
    }),
    prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 20
    })
  ]);

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message }
  });

  const reply = await generateChatReply({
    bot,
    userMessage: message,
    schedules,
    recentPosts,
    history
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: reply }
  });

  await prisma.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

  return jsonOk({ sessionId: session.id, message: assistantMessage, reply });
}
