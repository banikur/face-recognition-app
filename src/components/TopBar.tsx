"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <header className="h-14 w-full border-b border-[#E5E7EB] bg-white flex-shrink-0">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 sm:px-6">
        <Link href="/" className="text-base sm:text-lg font-semibold text-[#111]">
          SkinLab
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
          <Link href="/" className="font-medium text-[#3B82F6] touch-manipulation">
            Live Scan
          </Link>
          <Link href="/products" className="text-[#111]/60 hover:text-[#111] touch-manipulation">
            Products
          </Link>
        </nav>
      </div>
    </header>
  );
}
