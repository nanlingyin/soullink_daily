"use client";

import { useEffect, useState } from "react";

type ImagePreviewProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  downloadName?: string;
  hint?: string;
};

function ensureDownloadName(name?: string) {
  const safeName = (name || "soullink-image.png").replace(/[\\/:*?"<>|]/g, "-");
  return /\.[a-zA-Z0-9]+$/.test(safeName) ? safeName : `${safeName}.png`;
}

export function ImagePreview({ src, alt, className = "", imageClassName = "", downloadName, hint = "点击查看大图" }: ImagePreviewProps) {
  const imageSrc = src || "/placeholder-post.svg";
  const fileName = ensureDownloadName(downloadName);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function saveImage() {
    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(imageSrc);
      if (!response.ok) throw new Error("图片下载失败");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setSaveMessage("已开始保存图片");
    } catch {
      setSaveMessage("自动保存失败，可长按/右键大图另存为。已为你打开原图。 ");
      window.open(imageSrc, "_blank", "noopener,noreferrer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`group relative overflow-hidden text-left ${className}`} aria-label={`查看大图：${alt}`}>
        <img src={imageSrc} alt={alt} className={imageClassName} />
        <span className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-black/48 px-3 py-2 text-center text-xs font-bold text-white opacity-0 shadow-lg backdrop-blur transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {hint}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/78 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/20 bg-white/92 shadow-2xl sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-3 border-b border-purple-100/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-ink">{alt}</p>
                <p className="mt-1 text-xs text-zinc-500">可放大预览，也可以保存到本地</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={saveImage} disabled={saving} className="soft-button px-4 py-2 text-sm font-bold">
                  {saving ? "保存中..." : "保存图片"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-sm">
                  关闭
                </button>
              </div>
            </div>
            <div className="soft-scrollbar flex-1 overflow-auto bg-zinc-950/95 p-2 sm:p-4">
              <img src={imageSrc} alt={alt} className="mx-auto max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
            </div>
            {saveMessage ? <p className="border-t border-purple-100/80 px-5 py-3 text-xs text-zinc-500">{saveMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}