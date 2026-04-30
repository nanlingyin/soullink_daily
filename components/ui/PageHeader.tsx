import Link from "next/link";

export function PageHeader({ title, description, actionHref, actionLabel }: { title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link href="/" className="mb-3 inline-flex text-sm font-semibold text-purple-700">
          ← soullink daily
        </Link>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl leading-7 text-zinc-600">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="soft-button inline-flex items-center justify-center px-6 py-3 font-semibold">
          {actionLabel}
        </Link>
      ) : null}
    </header>
  );
}
