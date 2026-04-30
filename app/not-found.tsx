import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <section className="glass-card rounded-[2rem] p-10 text-center">
        <h1 className="text-3xl font-black">页面不存在</h1>
        <p className="mt-3 text-zinc-600">可能角色已经被删除，或者链接不正确。</p>
        <Link href="/bots" className="soft-button mt-6 inline-block px-6 py-3 font-bold">
          返回 Bot 列表
        </Link>
      </section>
    </main>
  );
}
