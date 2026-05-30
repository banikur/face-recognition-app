"use client";

import { useState, useEffect, useCallback } from "react";
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

interface UserInfo {
  nama: string;
  usia: number;
}

// ── Modal Form Nama & Usia ────────────────────────────────────────────────────
function UserInfoModal({ onSubmit }: { onSubmit: (info: UserInfo) => void }) {
  const [nama, setNama] = useState("");
  const [usia, setUsia] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) { setError("Nama wajib diisi."); return; }
    const age = parseInt(usia, 10);
    if (!usia || isNaN(age) || age < 1 || age > 100) {
      setError("Usia harus berupa angka antara 1–100.");
      return;
    }
    onSubmit({ nama: nama.trim(), usia: age });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-7 shadow-2xl"
        style={{ backgroundColor: "#1C1C1E", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#3B82F6,#22D3EE)" }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <h2 className="text-center text-base font-semibold mb-1" style={{ color: "#F5F5F7" }}>
          Sebelum Memulai
        </h2>
        <p className="text-center text-xs mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
          Isi data berikut agar hasil analisis dapat tersimpan dengan benar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Nama Lengkap <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={e => { setNama(e.target.value); setError(""); }}
              placeholder="Masukkan nama Anda"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#F5F5F7",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Usia <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="number"
              value={usia}
              onChange={e => { setUsia(e.target.value); setError(""); }}
              placeholder="Contoh: 25"
              min={1}
              max={100}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#F5F5F7",
              }}
            />
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#FCA5A5" }}>
              {error}
            </p>
          )}

          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            Data Anda hanya digunakan untuk keperluan analisis kulit dan tidak dibagikan kepada pihak ketiga.
          </p>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg,#3B82F6,#22D3EE)", color: "#fff" }}
          >
            Mulai Analisis
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Ganti Pengguna Confirmation Dialog ────────────────────────────────────────
function ConfirmResetDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: "#242426", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(251,146,60,0.15)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: "#FB923C" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "#F5F5F7" }}>Ganti Pengguna?</h3>
        </div>
        <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
          Sesi analisis saat ini akan direset dan data pengguna dihapus dari sesi ini.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: "#FB923C", color: "#fff" }}
          >
            Ya, Ganti
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Show modal once per session
  useEffect(() => {
    const saved = sessionStorage.getItem("face-analytic-user");
    if (saved) {
      try { setUserInfo(JSON.parse(saved)); } catch { /* ignore */ }
    } else {
      setShowModal(true);
    }
  }, []);

  const handleUserInfoSubmit = (info: UserInfo) => {
    sessionStorage.setItem("face-analytic-user", JSON.stringify(info));
    setUserInfo(info);
    setShowModal(false);
  };

  // Ganti pengguna: clear session + reset state + re-show modal
  const handleConfirmReset = useCallback(() => {
    sessionStorage.removeItem("face-analytic-user");
    setUserInfo(null);
    setAnalysis(null);
    setRecommendations(null);
    setShowConfirmReset(false);
    setShowModal(true);
  }, []);

  const handleCapture = async (result: AnalysisResult) => {
    setIsAnalyzing(true);
    setAnalysis(result);

    if (result.faceDetected && result.scores) {
      try {
        const res = await fetch("/api/analysis/save-from-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores: result.scores,
            skinType: result.skinType,
            nama: userInfo?.nama ?? "Guest",
            usia: userInfo?.usia ?? 0,
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
    // ── Full-viewport no-scroll container ──────────────────────────────────────
    <div
      className="flex flex-col"
      style={{
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "#1C1C1E",
        color: "#F5F5F7",
      }}
    >
      {/* Modals */}
      {showModal && <UserInfoModal onSubmit={handleUserInfoSubmit} />}
      {showConfirmReset && (
        <ConfirmResetDialog
          onConfirm={handleConfirmReset}
          onCancel={() => setShowConfirmReset(false)}
        />
      )}

      {/* ── Navbar — fixed height ─────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 flex-shrink-0"
        style={{
          height: 52,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
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

        {/* Nav right */}
        <div className="flex items-center gap-1.5">
          {/* Live Scan active pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "#3B82F6", color: "#fff" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            Live Scan
          </div>

          <Link
            href="/products"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.75)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Produk
          </Link>

          {/* User info chip + Ganti Pengguna */}
          {userInfo && (
            <div className="flex items-center gap-1">
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{userInfo.nama}, {userInfo.usia} th</span>
              </div>

              {/* Ganti Pengguna button */}
              <button
                onClick={() => setShowConfirmReset(true)}
                title="Ganti Pengguna"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}
              >
                {/* User-edit icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content — fills exactly remaining viewport height ─────────────── */}
      <div
        className="flex flex-col lg:flex-row flex-1 min-h-0"
        style={{ overflow: "hidden" }}
      >
        {/* Left: Camera panel — fills all remaining height */}
        <div
          className="flex-1 min-h-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          <CameraPanel onCapture={handleCapture} isAnalyzing={isAnalyzing} />
        </div>

        {/* Right: Results + Recommendations — fixed width, internal scroll only */}
        <div
          className="w-full lg:w-[320px] xl:w-[360px] flex flex-col flex-shrink-0 min-h-0"
          style={{
            backgroundColor: "#1C1C1E",
            overflowY: "auto",
          }}
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
