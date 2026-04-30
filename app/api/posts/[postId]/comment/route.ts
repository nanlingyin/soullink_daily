import { generateCommentReply } from "@/lib/ai/commentResponder";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";

type Params = { params: { postId: string } };

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const body = await readJson<{ content?: string }>(request);
  const content = body.content?.trim();

  if (!content) return jsonError("评论不能为空");

  const post = await prisma.botPost.findFirst({
    where: { id: params.postId, userId: user.id },
    include: { bot: true }
  });
  if (!post) return jsonError("动态不存在", 404);

  const aiReply = await generateCommentReply(post.bot, post, content);
  const comment = await prisma.botPostComment.create({
    data: {
      postId: post.id,
      userId: user.id,
      content,
      aiReply
    }
  });

  await prisma.botPost.update({
    where: { id: post.id },
    data: { commentsCount: { increment: 1 } }
  });

  return jsonOk({ comment });
}
