"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="vh-full bg-gray-50">
      <TopBar />
      <main className="h-[calc(100vh-56px)] h-[calc(100dvh-56px)]">
        {children}
      </main>
    </div>
  );
}
