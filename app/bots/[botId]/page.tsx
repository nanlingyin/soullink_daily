import Link from "next/link";
import { notFound } from "next/navigation";
import { BotControlDock } from "@/components/bot/BotControlDock";
import { BotProfile } from "@/components/bot/BotProfile";
import { PostFeed } from "@/components/post/PostFeed";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import { prisma } from "@/lib/db";

export default async function BotDetailPage({ params }: { params: { botId: string } }) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({
    where: { id: params.botId, userId: user.id }
  });

  if (!bot) notFound();

  const [schedules, posts] = await Promise.all([
    prisma.botSchedule.findMany({
      where: { botId: bot.id, scheduleDate: toDateKey() },
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
      include: { posts: { select: { id: true } } }
    }),
    prisma.botPost.findMany({
      where: { botId: bot.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        bot: { select: { name: true, avatarUrl: true } },
        likes: { where: { userId: user.id }, select: { id: true } },
        comments: { orderBy: { createdAt: "asc" } }
      }
    })
  ]);

  return (
    <main>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/bots" className="text-sm font-semibold text-purple-700">← 返回 Bot 列表</Link>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{bot.name} 的生活空间</h1>
          <p className="mt-2 max-w-2xl leading-7 text-zinc-600">日程、动态、评论与聊天会共享同一份人设上下文。</p>
        </div>
        <Link href={`/bots/${bot.id}/posts`} className="inline-flex justify-center rounded-full bg-white/80 px-5 py-3 text-sm font-bold text-purple-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
          查看动态墙
        </Link>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)_380px] 2xl:grid-cols-[340px_minmax(0,1fr)_420px]">
        <BotProfile bot={bot} />
        <div className="min-w-0 order-3 xl:order-none">
          <PostFeed posts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), comments: post.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })) }))} />
        </div>
        <BotControlDock botId={bot.id} botName={bot.name} schedules={schedules} />
      </div>
    </main>
  );
}
