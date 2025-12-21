"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <header className="h-14 w-full border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-[#111]">
          SkinLab
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="font-medium text-[#3B82F6]">
            Live Scan
          </Link>
          <Link href="/products" className="text-[#111]/60 hover:text-[#111]">
            Products
          </Link>
        </nav>
      </div>
    </header>
  );
}
