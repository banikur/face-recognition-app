"use client";

import { useState } from "react";
import CameraPanel from "@/components/CameraPanel";
import ResultPanel from "@/components/ResultPanel";
import RecommendationCard from "@/components/RecommendationCard";
import TopBar from "@/components/TopBar";

export default function Home() {
  const [skinType, setSkinType] = useState<string | null>(null);
  const [scores, setScores] = useState<{ oily: number; dry: number; normal: number; acne: number } | null>(null);

  const handleCapture = () => {
    setSkinType("Oily");
    setScores({ oily: 78, dry: 22, normal: 45, acne: 30 });
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900 flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 px-6 py-4">
        <div className="h-full rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.06)] p-5">
          <div className="grid h-full min-h-0 grid-cols-[7fr_5fr] gap-6">
            <div className="min-h-0">
              <CameraPanel onCapture={handleCapture} />
            </div>
            <div className="flex min-h-0 flex-col gap-4">
              <ResultPanel skinType={skinType} scores={scores} />
              <RecommendationCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
