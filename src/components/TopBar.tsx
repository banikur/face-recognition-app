"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <header className="h-16 w-full border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold text-zinc-900">
          Skin Analyzer
        </Link>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-500">
          <Link href="/face-recognition" className="rounded-full bg-white/70 px-3 py-1 shadow-sm shadow-white/60">
            Live Scan
          </Link>
          <Link href="/recommendations" className="rounded-full px-3 py-1 text-zinc-500">
            Products
          </Link>
        </div>
      </div>
    </header>
  );
}
