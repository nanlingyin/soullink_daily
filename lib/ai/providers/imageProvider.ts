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
  mimeType: string;
  sizeBytes: number;
  sourceKind: "data-url" | "remote-url" | "local-file";
};

type ImageLogContext = Record<string, unknown>;

function createImageRunId() {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function logImageInfo(runId: string, message: string, context?: ImageLogContext) {
  console.info(`[image-generation:${runId}] ${message}`, context || "");
}

function logImageWarn(runId: string, message: string, context?: ImageLogContext) {
  console.warn(`[image-generation:${runId}] ${message}`, context || "");
}

function getImageUrlKind(imageUrl: string) {
  if (imageUrl.startsWith("data:")) return "base64-data-url";
  if (imageUrl.startsWith("/")) return "local-or-public-path";
  if (/^https?:\/\//i.test(imageUrl)) return "remote-url";
  return "unknown";
}

function truncateForLog(input: string, maxLength = 500) {
  return input.length > maxLength ? `${input.slice(0, maxLength)}...<truncated>` : input;
}

function getLocalReferencePathCandidates(imagePath: string) {
  const publicPath = path.join(process.cwd(), "public", imagePath.replace(/^\/+/, ""));

  // Next.js/public 上传文件保存为 `/uploads/xxx` 这种 Web URL。
  // 在 Windows 下 `path.isAbsolute("/uploads/xxx")` 会被解析成当前盘根目录 `F:\uploads\xxx`，
  // 所以必须优先按 public 路径查找，避免立绘误读失败。
  if (imagePath.startsWith("/")) {
    return path.isAbsolute(imagePath) ? [publicPath, imagePath] : [publicPath];
  }

  return path.isAbsolute(imagePath) ? [imagePath] : [publicPath];
}

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

async function loadReferenceImage(imageUrl: string, runId: string): Promise<LoadedReferenceImage | null> {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    logImageInfo(runId, "reference image url is empty, skip reference image");
    return null;
  }

  logImageInfo(runId, "reference image url received", {
    sourceKind: trimmed.startsWith("data:") ? "data-url" : /^https?:\/\//i.test(trimmed) ? "remote-url" : "local-file",
    urlPreview: trimmed.startsWith("data:") ? "data:<base64>" : trimmed
  });

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      logImageWarn(runId, "reference image data url is invalid");
      return null;
    }

    const mimeType = match[1] || "application/octet-stream";
    const buffer = Buffer.from(match[2], "base64");
    logImageInfo(runId, "reference image loaded from data url", {
      mimeType,
      sizeBytes: buffer.byteLength
    });

    return {
      blob: new Blob([buffer], { type: mimeType }),
      filename: `reference${extensionFromMimeType(mimeType)}`,
      mimeType,
      sizeBytes: buffer.byteLength,
      sourceKind: "data-url"
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const startedAt = Date.now();
    const response = await fetch(trimmed);
    const durationMs = Date.now() - startedAt;
    if (!response.ok) {
      logImageWarn(runId, "failed to fetch remote reference image", {
        status: response.status,
        statusText: response.statusText,
        durationMs
      });
      return null;
    }

    const mimeType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());
    logImageInfo(runId, "reference image loaded from remote url", {
      mimeType,
      sizeBytes: buffer.byteLength,
      durationMs
    });

    return {
      blob: new Blob([buffer], { type: mimeType }),
      filename: filenameFromUrl(trimmed, mimeType),
      mimeType,
      sizeBytes: buffer.byteLength,
      sourceKind: "remote-url"
    };
  }

  const localPathCandidates = getLocalReferencePathCandidates(trimmed);

  for (const localPath of localPathCandidates) {
    try {
      const buffer = await readFile(localPath);
      const mimeType = mimeTypeFromPath(localPath);
      logImageInfo(runId, "reference image loaded from local file", {
        requestedPath: trimmed,
        resolvedLocalPath: localPath,
        mimeType,
        sizeBytes: buffer.byteLength
      });

      return {
        blob: new Blob([buffer], { type: mimeType }),
        filename: path.basename(localPath) || `reference${extensionFromMimeType(mimeType)}`,
        mimeType,
        sizeBytes: buffer.byteLength,
        sourceKind: "local-file"
      };
    } catch (error) {
      logImageWarn(runId, "failed to load local reference image candidate", {
        requestedPath: trimmed,
        resolvedLocalPath: localPath,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  logImageWarn(runId, "all local reference image path candidates failed", {
    requestedPath: trimmed,
    candidates: localPathCandidates
  });
  return null;
}

function buildImageResult(imageUrl: string, provider: string, modelName: string): ImageGenerationResult {
  return { imageUrl, provider, modelName };
}

async function requestGeneratedImage(baseUrl: string, apiKey: string, model: string, imagePrompt: string, runId: string) {
  logImageInfo(runId, "calling text-only image generation api", {
    endpoint: `${baseUrl}/images/generations`,
    model,
    hasReferenceImage: false,
    promptLength: imagePrompt.length
  });

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
  referenceImage: LoadedReferenceImage,
  runId: string
) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", imagePrompt);
  form.append("size", "1024x1024");
  form.append("n", "1");
  form.append("image[]", referenceImage.blob, referenceImage.filename);

  logImageInfo(runId, "calling image edit api with reference image", {
    endpoint: `${baseUrl}/images/edits`,
    model,
    hasReferenceImage: true,
    imageField: "image[]",
    referenceFilename: referenceImage.filename,
    referenceMimeType: referenceImage.mimeType,
    referenceSizeBytes: referenceImage.sizeBytes,
    referenceSourceKind: referenceImage.sourceKind,
    promptLength: imagePrompt.length
  });

  return fetch(`${baseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });
}

async function parseImageResponse(
  response: Response,
  provider: string,
  model: string,
  runId: string,
  startedAt: number
): Promise<ImageGenerationResult | null> {
  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    logImageWarn(runId, "image api request failed", {
      provider,
      model,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      responseBodyPreview: truncateForLog(await response.text())
    });
    return null;
  }

  const data = await response.json();
  const imageUrl = data?.data?.[0]?.url || (data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : null);

  logImageInfo(runId, "image api request succeeded", {
    provider,
    model,
    status: response.status,
    durationMs,
    hasImageUrl: Boolean(imageUrl),
    imageUrlKind: imageUrl ? getImageUrlKind(imageUrl) : "fallback-placeholder"
  });

  return buildImageResult(imageUrl || "/placeholder-post.svg", provider, model);
}

export async function generateImage(imagePrompt: string, referenceImageUrl?: string | null): Promise<ImageGenerationResult> {
  const runId = createImageRunId();
  const startedAt = Date.now();
  const mockMode = process.env.AI_MOCK_MODE !== "false";
  const apiKey = process.env.IMAGE_API_KEY;

  logImageInfo(runId, "generation started", {
    mockMode,
    hasApiKey: Boolean(apiKey),
    hasReferenceImageUrl: Boolean(referenceImageUrl?.trim()),
    promptLength: imagePrompt.length,
    promptPreview: truncateForLog(imagePrompt, 300)
  });

  if (mockMode || !apiKey) {
    logImageInfo(runId, "skip external image api and return mock placeholder", {
      reason: mockMode ? "AI_MOCK_MODE is not false" : "IMAGE_API_KEY is missing",
      durationMs: Date.now() - startedAt
    });

    return {
      imageUrl: "/placeholder-post.svg",
      provider: "mock",
      modelName: "mock-image"
    };
  }

  const baseUrl = (process.env.IMAGE_API_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.IMAGE_MODEL || "gpt-image-1";
  let referenceImage: LoadedReferenceImage | null = null;

  if (referenceImageUrl) {
    try {
      referenceImage = await loadReferenceImage(referenceImageUrl, runId);
    } catch (error) {
      logImageWarn(runId, "reference image loading threw an error, will fall back to text-only generation", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    logImageInfo(runId, "no reference image url provided, will use text-only generation");
  }

  try {
    if (referenceImage) {
      const editStartedAt = Date.now();
      const editedResponse = await requestEditedImage(baseUrl, apiKey, model, imagePrompt, referenceImage, runId);
      const editedResult = await parseImageResponse(editedResponse, "openai-compatible-edit", model, runId, editStartedAt);
      if (editedResult) {
        logImageInfo(runId, "generation finished with reference-image edit result", {
          provider: editedResult.provider,
          modelName: editedResult.modelName,
          imageUrlKind: getImageUrlKind(editedResult.imageUrl),
          totalDurationMs: Date.now() - startedAt
        });
        return editedResult;
      }

      logImageWarn(runId, "image edit request failed, falling back to text-only generation");
    }

    const generateStartedAt = Date.now();
    const generatedResponse = await requestGeneratedImage(baseUrl, apiKey, model, imagePrompt, runId);
    const generatedResult = await parseImageResponse(generatedResponse, "openai-compatible", model, runId, generateStartedAt);
    if (generatedResult) {
      logImageInfo(runId, "generation finished with text-only result", {
        provider: generatedResult.provider,
        modelName: generatedResult.modelName,
        imageUrlKind: getImageUrlKind(generatedResult.imageUrl),
        totalDurationMs: Date.now() - startedAt
      });
      return generatedResult;
    }

    logImageWarn(runId, "all image api requests failed, return fallback placeholder", {
      totalDurationMs: Date.now() - startedAt
    });
    return buildImageResult("/placeholder-post.svg", "fallback", model);
  } catch (error) {
    logImageWarn(runId, "image model request threw an error, return fallback placeholder", {
      error: error instanceof Error ? error.message : String(error),
      totalDurationMs: Date.now() - startedAt
    });
    return buildImageResult("/placeholder-post.svg", "fallback", model);
  }
}
