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
            isAnalyzing={isAnalyzing}
            faceDetected={analysis?.faceDetected}
          />
          {analysis?.faceDetected && <RecommendationCard skinType={analysis.skinType} />}
        </div>
      </div>
    </div>
  );
}
