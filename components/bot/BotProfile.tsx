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
    <aside className="glass-card sticky top-6 rounded-[1.75rem] p-5">
      <div className="overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-pink-100 to-violet-100">
        <img src={bot.standingImageUrl || "/placeholder-post.svg"} alt={bot.name} className="h-80 w-full object-cover" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <img src={bot.avatarUrl || "/avatar-demo.svg"} alt={bot.name} className="h-14 w-14 rounded-2xl bg-white object-cover shadow" />
        <div>
          <h2 className="text-2xl font-black">{bot.name}</h2>
          <p className="text-sm text-purple-700">{bot.relationshipSetting || "熟悉的陪伴型伙伴"}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-600">{bot.personaText}</p>
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
    </aside>
  );
}
