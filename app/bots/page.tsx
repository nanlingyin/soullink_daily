import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BotCard } from "@/components/bot/BotCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function BotsPage() {
  const user = await getCurrentUser();
  const bots = await prisma.aiBot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { schedules: true, posts: true } }
    }
  });

  return (
    <main>
      <PageHeader
        title="我的 AI Bot"
        description="创建角色、生成日程、发布动态，让 AI 角色从聊天窗口走进自己的生活。"
        actionHref="/bots/new"
        actionLabel="创建 Bot"
      />
      {bots.length === 0 ? (
        <EmptyState title="还没有角色" description="先创建一个二次元 AI Bot，填写人设和生活偏好。" href="/bots/new" action="创建第一个 Bot" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </main>
  );
}
