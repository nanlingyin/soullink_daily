import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { sessionId: string } };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const session = await prisma.chatSession.findFirst({
    where: { id: params.sessionId, userId: user.id },
    include: {
      bot: true,
      messages: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!session) return jsonError("会话不存在", 404);
  return jsonOk({ session });
}
