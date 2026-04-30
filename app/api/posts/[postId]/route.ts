import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { postId: string } };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const post = await prisma.botPost.findFirst({
    where: { id: params.postId, userId: user.id },
    include: {
      bot: true,
      comments: { orderBy: { createdAt: "asc" } },
      likes: { where: { userId: user.id }, select: { id: true } }
    }
  });

  if (!post) return jsonError("动态不存在", 404);
  return jsonOk({ post });
}
