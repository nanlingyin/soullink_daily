import Link from "next/link";

export function EmptyState({
  title,
  description,
  href,
  action
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="glass-card rounded-[1.75rem] p-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-200 to-violet-200 text-3xl">
        ✦
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">{description}</p>
      {href && action ? (
        <Link href={href} className="soft-button mt-6 inline-block px-6 py-3 font-semibold">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
