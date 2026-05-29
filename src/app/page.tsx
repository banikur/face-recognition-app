"use client";

import { useState } from "react";
import CameraPanel from "@/components/CameraPanel";
import ResultPanel from "@/components/ResultPanel";
import RecommendationCard from "@/components/RecommendationCard";
import { AnalysisResult } from "@/lib/skinAnalyzer";
import Link from "next/link";

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

    if (result.faceDetected && result.scores) {
      try {
        const res = await fetch("/api/analysis/save-from-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores: result.scores, skinType: result.skinType }),
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
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#1C1C1E", color: "#F5F5F7" }}
    >
      {/* ── Top Navbar ── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#22D3EE)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#F5F5F7" }}>
            Face Analytic
          </span>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ backgroundColor: "#3B82F6", color: "#fff" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            Live scan
          </button>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#F5F5F7" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Products
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Camera */}
        <div
          className="lg:flex-1 flex flex-col min-h-0"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          <CameraPanel onCapture={handleCapture} isAnalyzing={isAnalyzing} />
        </div>

        {/* Right: Results */}
        <div
          className="w-full lg:w-[340px] xl:w-[380px] flex flex-col overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: "#1C1C1E" }}
        >
          <ResultPanel
            skinType={analysis?.skinType ?? null}
            scores={analysis?.scores ?? null}
            confidence={analysis?.confidence}
            isAnalyzing={isAnalyzing}
            faceDetected={analysis?.faceDetected}
          />
          <RecommendationCard
            skinType={analysis?.skinType ?? null}
            recommendations={analysis?.faceDetected ? recommendations : null}
          />
        </div>
      </div>
    </div>
  );
}
