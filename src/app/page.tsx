"use client";

import { useState } from "react";
import CameraPanel from "@/components/CameraPanel";
import ResultPanel from "@/components/ResultPanel";
import RecommendationCard from "@/components/RecommendationCard";
import { AnalysisResult } from "@/lib/skinAnalyzer";

interface RecommendedProduct {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  image_url?: string | null;
}

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async (result: AnalysisResult) => {
    setIsAnalyzing(true);
    setAnalysis(result);

    // Simpan ke analysis_logs & dapatkan rekomendasi (selaras dengan CNN)
    if (result.faceDetected && result.scores) {
      try {
        const res = await fetch("/api/analysis/save-from-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores: result.scores,
            skinType: result.skinType,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations ?? []);
        }
      } catch (e) {
        console.error("Failed to save analysis:", e);
      }
    }

    setTimeout(() => setIsAnalyzing(false), 300);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAFA] p-3 sm:p-6 overflow-hidden box-border">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] h-full gap-3 sm:gap-6 min-h-0 flex-1">
        {/* Left: Camera */}
        <div className="flex-shrink-0 lg:flex-shrink min-h-0 lg:h-full">
          <CameraPanel onCapture={handleCapture} isAnalyzing={isAnalyzing} />
        </div>

        {/* Right: Results - Scrollable on mobile */}
        <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1 lg:max-h-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          <ResultPanel
            skinType={analysis?.skinType ?? null}
            scores={analysis?.scores ?? null}
            confidence={analysis?.confidence}
            isAnalyzing={isAnalyzing}
            faceDetected={analysis?.faceDetected}
          />
          {analysis?.faceDetected && (
            <RecommendationCard
              skinType={analysis.skinType}
              recommendations={recommendations}
            />
          )}
        </div>
      </div>
    </div>
  );
}
