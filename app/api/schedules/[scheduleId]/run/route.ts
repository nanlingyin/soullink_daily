import { generatePostContent } from "@/lib/ai/postGenerator";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { generateImage } from "@/lib/ai/providers/imageProvider";

type Params = { params: { scheduleId: string } };

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const schedule = await prisma.botSchedule.findFirst({
    where: { id: params.scheduleId, bot: { userId: user.id } },
    include: { bot: true, posts: true }
  });

  if (!schedule) return jsonError("日程不存在", 404);
  if (schedule.posts.length > 0) {
    return jsonOk({ post: schedule.posts[0], reused: true });
  }

  const task = await prisma.imageGenerationTask.create({
    data: {
      botId: schedule.botId,
      scheduleId: schedule.id,
      inputImageUrl: schedule.bot.standingImageUrl,
      status: "running"
    }
  });

  try {
    await prisma.botSchedule.update({ where: { id: schedule.id }, data: { status: "generating" } });

    const recentPosts = await prisma.botPost.findMany({
      where: { botId: schedule.botId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { caption: true, scene: true }
    });
    const content = await generatePostContent(schedule.bot, schedule, recentPosts);
    const image = await generateImage(content.image_prompt, schedule.bot.standingImageUrl);

    const post = await prisma.botPost.create({
      data: {
        botId: schedule.botId,
        userId: user.id,
        scheduleId: schedule.id,
        imageUrl: image.imageUrl,
        caption: content.caption,
        mood: content.emotion || schedule.mood,
        scene: schedule.scene,
        imagePrompt: content.image_prompt,
        generationStatus: "success"
      },
      include: { bot: true, comments: true, likes: true }
    });

    await prisma.$transaction([
      prisma.botSchedule.update({
        where: { id: schedule.id },
        data: { status: "posted", executedAt: new Date() }
      }),
      prisma.imageGenerationTask.update({
        where: { id: task.id },
        data: {
          status: "success",
          prompt: content.image_prompt,
          outputImageUrl: image.imageUrl,
          provider: image.provider,
          modelName: image.modelName,
          postId: post.id
        }
      })
    ]);

    return jsonOk({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    await prisma.$transaction([
      prisma.botSchedule.update({ where: { id: schedule.id }, data: { status: "failed" } }),
      prisma.imageGenerationTask.update({ where: { id: task.id }, data: { status: "failed", errorMessage: message } })
    ]);
    return jsonError(message, 500);
  }
}
