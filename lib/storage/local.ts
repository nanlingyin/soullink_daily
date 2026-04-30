import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUploadFile(file: File, kind: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeKind = kind.replace(/[^a-zA-Z0-9_-]/g, "") || "file";
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const fileName = `${safeKind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
    path: filePath,
    size: buffer.byteLength,
    mimeType: file.type || "application/octet-stream"
  };
}
