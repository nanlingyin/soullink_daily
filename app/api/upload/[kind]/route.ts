import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { saveUploadFile } from "@/lib/storage/local";

type Params = { params: { kind: string } };

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("请上传文件");
  }

  const saved = await saveUploadFile(file, params.kind);
  const asset = await prisma.fileAsset.create({
    data: {
      userId: user.id,
      kind: params.kind,
      url: saved.url,
      path: saved.path,
      mimeType: saved.mimeType,
      size: saved.size
    }
  });

  return jsonOk({ asset, url: saved.url });
}
