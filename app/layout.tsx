import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "soullink daily",
  description: "让你的 AI 角色，认真生活。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="text-ink antialiased">
        <div className="mx-auto min-h-screen w-full max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
