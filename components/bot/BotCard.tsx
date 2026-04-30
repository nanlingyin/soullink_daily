import Link from "next/link";

type BotCardProps = {
  bot: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    standingImageUrl?: string | null;
    personaText: string;
    personalityTags?: string | null;
    _count?: { schedules: number; posts: number };
  };
};

export function BotCard({ bot }: BotCardProps) {
  return (
    <Link href={`/bots/${bot.id}`} className="glass-card block overflow-hidden rounded-[1.75rem] transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative h-48 bg-gradient-to-br from-pink-100 via-violet-100 to-orange-100">
        <img
          src={bot.standingImageUrl || "/placeholder-post.svg"}
          alt={bot.name}
          className="h-full w-full object-cover opacity-90"
        />
        <img
          src={bot.avatarUrl || "/avatar-demo.svg"}
          alt={`${bot.name} avatar`}
          className="absolute bottom-[-28px] left-6 h-16 w-16 rounded-2xl border-4 border-white bg-white object-cover shadow-lg"
        />
      </div>
      <div className="px-6 pb-6 pt-10">
        <h2 className="text-xl font-black">{bot.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{bot.personaText}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(bot.personalityTags || "日常,陪伴").split(/[,，]/).slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
              {tag.trim()}
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-4 text-sm text-zinc-500">
          <span>{bot._count?.schedules ?? 0} 条日程</span>
          <span>{bot._count?.posts ?? 0} 条动态</span>
        </div>
      </div>
    </Link>
  );
}
