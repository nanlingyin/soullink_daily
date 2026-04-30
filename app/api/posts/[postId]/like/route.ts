import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: { postId: string } };

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const post = await prisma.botPost.findFirst({ where: { id: params.postId, userId: user.id } });
  if (!post) return jsonError("动态不存在", 404);

  const exists = await prisma.botPostLike.findUnique({
    where: { postId_userId: { postId: post.id, userId: user.id } }
  });

  if (exists) {
    await prisma.$transaction([
      prisma.botPostLike.delete({ where: { id: exists.id } }),
      prisma.botPost.update({ where: { id: post.id }, data: { likesCount: { decrement: 1 } } })
    ]);
    return jsonOk({ liked: false });
  }

  await prisma.$transaction([
    prisma.botPostLike.create({ data: { postId: post.id, userId: user.id } }),
    prisma.botPost.update({ where: { id: post.id }, data: { likesCount: { increment: 1 } } })
  ]);

  return jsonOk({ liked: true });
}
