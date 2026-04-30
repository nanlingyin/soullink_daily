import Link from "next/link";
import { notFound } from "next/navigation";
import { PostFeed } from "@/components/post/PostFeed";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BotPostsPage({ params }: { params: { botId: string } }) {
  const user = await getCurrentUser();
  const bot = await prisma.aiBot.findFirst({ where: { id: params.botId, userId: user.id } });
  if (!bot) notFound();

  const posts = await prisma.botPost.findMany({
    where: { botId: bot.id, userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      bot: { select: { name: true, avatarUrl: true } },
      likes: { where: { userId: user.id }, select: { id: true } },
      comments: { orderBy: { createdAt: "asc" } }
    }
  });

  return (
    <main className="mx-auto max-w-4xl">
      <header className="mb-8">
        <Link href={`/bots/${bot.id}`} className="text-sm font-semibold text-purple-700">← 返回 {bot.name} 主页</Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{bot.name} 的动态墙</h1>
        <p className="mt-2 leading-7 text-zinc-600">像朋友圈一样浏览角色的生活记录。点击图片可查看大图并保存。</p>
      </header>
      <PostFeed posts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), comments: post.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })) }))} />
    </main>
  );
}
