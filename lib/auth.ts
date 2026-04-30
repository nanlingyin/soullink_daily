import { prisma } from "@/lib/db";

const DEMO_EMAIL = "demo@soullink.daily";

export async function getCurrentUser() {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      username: "Demo User",
      avatarUrl: "/avatar-demo.svg"
    }
  });
}

export async function requireOwnedBot(botId: string, userId: string) {
  const bot = await prisma.aiBot.findFirst({
    where: { id: botId, userId }
  });

  if (!bot) {
    throw new Error("BOT_NOT_FOUND");
  }

  return bot;
}
