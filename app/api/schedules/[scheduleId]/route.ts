import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, readJson } from "@/lib/http";

type Params = { params: { scheduleId: string } };

export async function PUT(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const schedule = await prisma.botSchedule.findFirst({
    where: { id: params.scheduleId, bot: { userId: user.id } }
  });

  if (!schedule) return jsonError("日程不存在", 404);

  const body = await readJson<Record<string, string | undefined>>(request);
  const updated = await prisma.botSchedule.update({
    where: { id: schedule.id },
    data: {
      startTime: body.startTime || schedule.startTime,
      title: body.title || schedule.title,
      scene: body.scene || schedule.scene,
      mood: body.mood || schedule.mood,
      postStyle: body.postStyle ?? schedule.postStyle,
      imagePromptHint: body.imagePromptHint ?? schedule.imagePromptHint,
      source: "user_edited"
    }
  });

  return jsonOk({ schedule: updated });
}
