import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { bot: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return jsonOk({ sessions });
}
