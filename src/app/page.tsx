"use client";

import { useState } from "react";
import CameraPanel from "@/components/CameraPanel";
import ResultPanel from "@/components/ResultPanel";
import RecommendationCard from "@/components/RecommendationCard";
import { AnalysisResult } from "@/lib/skinAnalyzer";

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = (result: AnalysisResult) => {
    setIsAnalyzing(true);

    // Small delay to show loading state
    setTimeout(() => {
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 500);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAFA] p-6">
      <div className="grid h-full grid-cols-[1fr_380px] gap-6">
        {/* Left: Camera */}
        <CameraPanel onCapture={handleCapture} isAnalyzing={isAnalyzing} />

        {/* Right: Results */}
        <div className="flex flex-col gap-4 overflow-auto">
          <ResultPanel
            skinType={analysis?.skinType ?? null}
            scores={analysis?.scores ?? null}
            isAnalyzing={isAnalyzing}
            faceDetected={analysis?.faceDetected}
          />
          {analysis?.faceDetected && <RecommendationCard skinType={analysis.skinType} />}
        </div>
      </div>
    </div>
  );
}
