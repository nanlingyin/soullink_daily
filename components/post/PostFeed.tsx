"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Post = {
  id: string;
  imageUrl?: string | null;
  caption: string;
  mood?: string | null;
  scene?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  bot: { name: string; avatarUrl?: string | null };
  likes?: { id: string }[];
  comments?: { id: string; content: string; aiReply?: string | null; createdAt: string }[];
};

export function PostFeed({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <section className="glass-card rounded-[1.75rem] p-8 text-center text-zinc-500">
        还没有动态。先在日程里点击“生成动态”，让角色发第一条朋友圈吧。
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const liked = Boolean(post.likes?.length);

  async function likePost() {
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    router.refresh();
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = comment.trim();
    if (!value) return;

    setBusy(true);
    try {
      await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value })
      });
      setComment("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="glass-card overflow-hidden rounded-[1.75rem]">
      <div className="flex items-center gap-3 p-5">
        <img src={post.bot.avatarUrl || "/avatar-demo.svg"} alt={post.bot.name} className="h-12 w-12 rounded-2xl object-cover" />
        <div>
          <h3 className="font-black">{post.bot.name}</h3>
          <p className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleString("zh-CN")}</p>
        </div>
      </div>
      <img src={post.imageUrl || "/placeholder-post.svg"} alt={post.caption} className="max-h-[640px] w-full object-cover" />
      <div className="space-y-4 p-5">
        <p className="leading-8 text-zinc-700">{post.caption}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {post.mood ? <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">{post.mood}</span> : null}
          {post.scene ? <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">{post.scene}</span> : null}
        </div>
        <div className="flex items-center gap-3 border-t border-white/70 pt-4">
          <button onClick={likePost} className={`rounded-full px-4 py-2 text-sm font-bold ${liked ? "bg-pink-500 text-white" : "bg-white/80 text-zinc-700"}`}>
            ♥ {post.likesCount}
          </button>
          <span className="text-sm text-zinc-500">💬 {post.commentsCount}</span>
        </div>
        <div className="space-y-3">
          {post.comments?.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/65 p-3 text-sm">
              <p><span className="font-bold text-purple-700">你：</span>{item.content}</p>
              {item.aiReply ? <p className="mt-2 text-zinc-700"><span className="font-bold text-pink-600">{post.bot.name}：</span>{item.aiReply}</p> : null}
            </div>
          ))}
        </div>
        <form onSubmit={submitComment} className="flex gap-2">
          <input className="field py-2" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="写一句评论，看看她怎么回复..." />
          <button disabled={busy} className="soft-button shrink-0 px-5 py-2 text-sm font-bold">
            发送
          </button>
        </form>
      </div>
    </article>
  );
}
