import { ImagePreview } from "@/components/ui/ImagePreview";

export function BotProfile({
  bot
}: {
  bot: {
    name: string;
    avatarUrl?: string | null;
    standingImageUrl?: string | null;
    personaText: string;
    speakingStyle?: string | null;
    personalityTags?: string | null;
    relationshipSetting?: string | null;
  };
}) {
  return (
    <aside className="glass-card flex h-full flex-col rounded-[1.75rem] p-4 sm:p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-8.5rem)] xl:min-h-[620px] xl:max-h-[860px] xl:overflow-hidden">
      <div className="overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-pink-100 via-violet-100 to-orange-100 shadow-inner">
        <ImagePreview
          src={bot.standingImageUrl || "/placeholder-post.svg"}
          alt={`${bot.name} 的立绘`}
          downloadName={`${bot.name}-standing.png`}
          className="block h-64 w-full sm:h-80 xl:h-[min(36vh,340px)]"
          imageClassName="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
        />
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white/48 p-3">
        <img src={bot.avatarUrl || "/avatar-demo.svg"} alt={bot.name} className="h-14 w-14 rounded-2xl bg-white object-cover shadow" />
        <div className="min-w-0">
          <h2 className="text-2xl font-black">{bot.name}</h2>
          <p className="truncate text-sm text-purple-700">{bot.relationshipSetting || "熟悉的陪伴型伙伴"}</p>
        </div>
      </div>
      <div className="soft-scrollbar mt-4 min-h-0 flex-1 xl:overflow-y-auto xl:pr-1">
        <p className="text-sm leading-7 text-zinc-600">{bot.personaText}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(bot.personalityTags || "温柔,日常,陪伴").split(/[,，]/).map((tag) => (
            <span key={tag} className="rounded-full bg-white/80 px-3 py-1 text-purple-700">
              {tag.trim()}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm text-zinc-600">
          <p className="font-bold text-ink">说话风格</p>
          <p className="mt-2 leading-6">{bot.speakingStyle || "自然、简短、有陪伴感"}</p>
        </div>
      </div>
    </aside>
  );
}
