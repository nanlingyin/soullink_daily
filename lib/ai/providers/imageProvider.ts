import { readFile } from "fs/promises";
import path from "path";

export type ImageGenerationResult = {
  imageUrl: string;
  provider: string;
  modelName: string;
};

type LoadedReferenceImage = {
  blob: Blob;
  filename: string;
};

function mimeTypeFromPath(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".bin";
  }
}

function filenameFromUrl(imageUrl: string, mimeType: string) {
  const pathname = imageUrl.includes("://") ? new URL(imageUrl).pathname : imageUrl;
  const baseName = path.basename(pathname) || "reference-image";
  return path.extname(baseName) ? baseName : `${baseName}${extensionFromMimeType(mimeType)}`;
}

async function loadReferenceImage(imageUrl: string): Promise<LoadedReferenceImage | null> {
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1] || "application/octet-stream";
    const buffer = Buffer.from(match[2], "base64");
    return {
      blob: new Blob([buffer], { type: mimeType }),
      filename: `reference${extensionFromMimeType(mimeType)}`
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const response = await fetch(trimmed);
    if (!response.ok) return null;

    const mimeType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      blob: new Blob([buffer], { type: mimeType }),
      filename: filenameFromUrl(trimmed, mimeType)
    };
  }

  const localPath = path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), "public", trimmed.replace(/^\/+/, ""));

  try {
    const buffer = await readFile(localPath);
    const mimeType = mimeTypeFromPath(localPath);
    return {
      blob: new Blob([buffer], { type: mimeType }),
      filename: path.basename(localPath) || `reference${extensionFromMimeType(mimeType)}`
    };
  } catch {
    return null;
  }
}

function buildImageResult(imageUrl: string, provider: string, modelName: string): ImageGenerationResult {
  return { imageUrl, provider, modelName };
}

async function requestGeneratedImage(baseUrl: string, apiKey: string, model: string, imagePrompt: string) {
  return fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: imagePrompt,
      size: "1024x1024",
      n: 1
    })
  });
}

async function requestEditedImage(
  baseUrl: string,
  apiKey: string,
  model: string,
  imagePrompt: string,
  referenceImage: LoadedReferenceImage
) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", imagePrompt);
  form.append("size", "1024x1024");
  form.append("n", "1");
  form.append("image[]", referenceImage.blob, referenceImage.filename);

  return fetch(`${baseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });
}

async function parseImageResponse(response: Response, provider: string, model: string): Promise<ImageGenerationResult | null> {
  if (!response.ok) {
    console.warn("Image model request failed", await response.text());
    return null;
  }

  const data = await response.json();
  const imageUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);

  return buildImageResult(imageUrl || "/placeholder-post.svg", provider, model);
}

export async function generateImage(imagePrompt: string, referenceImageUrl?: string | null): Promise<ImageGenerationResult> {
  const mockMode = process.env.AI_MOCK_MODE !== "false";
  const apiKey = process.env.IMAGE_API_KEY;

  if (mockMode || !apiKey) {
    return {
      imageUrl: "/placeholder-post.svg",
      provider: "mock",
      modelName: "mock-image"
    };
  }

  const baseUrl = (process.env.IMAGE_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.IMAGE_MODEL || "gpt-image-1";
  const referenceImage = referenceImageUrl ? await loadReferenceImage(referenceImageUrl) : null;

  try {
    if (referenceImage) {
      const editedResponse = await requestEditedImage(baseUrl, apiKey, model, imagePrompt, referenceImage);
      const editedResult = await parseImageResponse(editedResponse, "openai-compatible-edit", model);
      if (editedResult) {
        return editedResult;
      }

      console.warn("Image edit request failed, falling back to text-only generation");
    }

    const generatedResponse = await requestGeneratedImage(baseUrl, apiKey, model, imagePrompt);
    const generatedResult = await parseImageResponse(generatedResponse, "openai-compatible", model);
    if (generatedResult) {
      return generatedResult;
    }

    return buildImageResult("/placeholder-post.svg", "fallback", model);
  } catch (error) {
    console.warn("Image model request error", error);
    return buildImageResult("/placeholder-post.svg", "fallback", model);
  }
}
