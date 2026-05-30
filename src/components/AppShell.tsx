"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import TopBar from "@/components/TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // "/" and "/login" manage their own full-page layout
  const isStandalone = pathname === "/" || pathname === "/login";

  // Lock body scroll for the scan page; allow scroll everywhere else
  useEffect(() => {
    if (isStandalone) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isStandalone]);

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main, #F8FAFC)" }}>
      <TopBar />
      <main style={{ height: "calc(100vh - 56px)", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
