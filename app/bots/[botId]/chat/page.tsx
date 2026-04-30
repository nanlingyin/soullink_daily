import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatBox } from "@/components/chat/ChatBox";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BotChatPage({ params }: { params: { botId: string } }) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!bot) notFound();

  return (
    <main className="mx-auto max-w-2xl">
      <header className="mb-8">
        <Link href={`/bots/${bot.id}`} className="text-sm font-semibold text-purple-700">← 返回 {bot.name} 主页</Link>
        <h1 className="mt-3 text-3xl font-black">和 {bot.name} 聊天</h1>
        <p className="mt-2 text-zinc-600">聊天上下文会联动今日日程和最近动态。</p>
      </header>
      <ChatBox botId={bot.id} botName={bot.name} />
    </main>
  );
}
