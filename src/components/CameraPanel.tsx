"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { analyzeSnapshot, snapshotFromVideo, AnalysisResult } from "@/lib/skinAnalyzer";
import { initializeFaceDetection } from "@/lib/faceDetection";
import { loadSkinModel } from "@/lib/cnnSkinClassifier";
import Swal from "sweetalert2";

interface Props {
  onCapture: (result: AnalysisResult) => void;
  isAnalyzing?: boolean;
}

type InputMode = "camera" | "upload";
type ProcessingState = "idle" | "detecting" | "classifying" | "done";

function getUserMediaFn(): ((c: MediaStreamConstraints) => Promise<MediaStream>) | null {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  }
  interface LegacyNav extends Navigator {
    getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    webkitGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    mozGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
  }
  const nav = navigator as LegacyNav;
  const fn = nav.getUserMedia ?? nav.webkitGetUserMedia ?? nav.mozGetUserMedia;
  if (!fn) return null;
  return (c) =>
    new Promise((res, rej) =>
      (fn as (c: MediaStreamConstraints, s: (s: MediaStream) => void, e: (e: Error) => void) => void)(c, res, rej)
    );
}

export default function CameraPanel({ onCapture, isAnalyzing = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<InputMode>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadImageLoaded, setUploadImageLoaded] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");

  // ── Model warm-up ────────────────────────────────────────────────────────────
  useEffect(() => {
    Swal.fire({
      title: "Privacy & Data Usage",
      html: `<div style="text-align:left;line-height:1.6;font-size:14px;">
        <p>Website ini dibuat khusus untuk keperluan <b>demo Tugas Akhir</b>.</p>
        <p>Sistem <b>tidak menyimpan foto, gambar wajah, atau data biometrik</b> pengguna.
        Seluruh proses pengolahan wajah dilakukan <b>secara langsung di browser</b> (client-side).</p>
        <p style="color:#6B7280;font-size:12px;">Dengan melanjutkan, Anda memahami bahwa aplikasi ini hanya digunakan untuk keperluan akademik.</p>
      </div>`,
      icon: "info",
      confirmButtonText: "Saya Mengerti",
      confirmButtonColor: "#3B82F6",
      width: 420,
      padding: "1.5rem",
    });
    initializeFaceDetection().catch(() => {});
    loadSkinModel().catch(() => {});
  }, []);

  // ── Camera lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "camera") { stopStream(); return; }
    let cancelled = false;

    const startCamera = async () => {
      try {
        const isSecure =
          window.isSecureContext ||
          location.protocol === "https:" ||
          ["localhost", "127.0.0.1"].includes(location.hostname) ||
          /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);

        if (!isSecure) throw Object.assign(new Error("HTTPS_REQUIRED"), { name: "SecurityError" });

        const getUserMedia = getUserMediaFn();
        if (!getUserMedia) throw new Error("getUserMedia tidak didukung di browser ini.");

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const stream = await getUserMedia({
          video: isMobile
            ? { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.muted = true;
          await videoRef.current.play();
          setCameraReady(true);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as { name?: string; message?: string };
        let msg = "Gagal mengakses kamera.";
        if (e.message === "HTTPS_REQUIRED" || e.name === "SecurityError")
          msg = "Akses kamera memerlukan HTTPS. Gunakan localhost atau setup SSL.";
        else if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
          msg = "Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
        else if (e.name === "NotFoundError") msg = "Kamera tidak ditemukan.";
        else if (e.name === "NotReadableError") msg = "Kamera sedang digunakan aplikasi lain.";
        else if (e.message) msg = e.message;
        setError(msg);
        setCameraReady(false);
      }
    };

    startCamera();
    return () => { cancelled = true; stopStream(); setCameraReady(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ── Capture ──────────────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (processingState !== "idle" || isAnalyzing) return;

    try {
      setProcessingState("detecting");
      let result: AnalysisResult;

      if (mode === "camera") {
        const video = videoRef.current;
        if (!video || !cameraReady) { setProcessingState("idle"); return; }
        const snapshot = snapshotFromVideo(video);
        if (!snapshot) { setProcessingState("idle"); return; }
        setProcessingState("classifying");
        result = await analyzeSnapshot(snapshot);
      } else {
        const img = uploadedImageRef.current;
        if (!img || !uploadImageLoaded) { setProcessingState("idle"); return; }
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")!.drawImage(img, 0, 0);
        setProcessingState("classifying");
        result = await analyzeSnapshot(canvas);
      }

      setProcessingState("done");

      if (result.faceDetected && result.imageData) {
        fetch("/api/dataset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: result.imageData, scores: result.scores, skinType: result.skinType }),
        }).catch(() => {});
      }

      onCapture(result);
    } catch (err) {
      console.error("Capture error:", err);
      setProcessingState("idle");
    } finally {
      setTimeout(() => setProcessingState("idle"), 400);
    }
  }, [mode, cameraReady, uploadImageLoaded, processingState, isAnalyzing, onCapture]);

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("Hanya boleh mengunggah file JPG atau PNG."); e.target.value = ""; return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran file melebihi 3MB."); e.target.value = ""; return;
    }
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadImageLoaded(false);
      setError(null);
      setUploadLoading(false);
      e.target.value = "";
    };
    reader.onerror = () => { setError("Gagal membaca file."); setUploadLoading(false); e.target.value = ""; };
    reader.readAsDataURL(file);
  };

  const isProcessing = processingState !== "idle" || isAnalyzing;
  const captureDisabled =
    isProcessing || uploadLoading ||
    (mode === "camera" && !cameraReady) ||
    (mode === "upload" && !uploadedImage);

  const processingLabel =
    processingState === "detecting" ? "Mendeteksi wajah..." : "Menganalisis kulit...";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#1C1C1E" }}
    >
      {/* ── Top bar: mode toggle + status ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Kamera button */}
        <button
          onClick={() => { setMode("camera"); setUploadedImage(null); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          style={{
            backgroundColor: mode === "camera" ? "rgba(255,255,255,0.12)" : "transparent",
            color: mode === "camera" ? "#F5F5F7" : "rgba(255,255,255,0.45)",
            border: mode === "camera" ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Kamera
        </button>

        {/* Upload button */}
        <button
          onClick={() => { setMode("upload"); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          style={{
            backgroundColor: mode === "upload" ? "rgba(255,255,255,0.12)" : "transparent",
            color: mode === "upload" ? "#F5F5F7" : "rgba(255,255,255,0.45)",
            border: mode === "upload" ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </button>

        {/* Camera status indicator */}
        {mode === "camera" && (
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cameraReady ? "#22C55E" : "#6B7280" }}
            />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {cameraReady ? "Kamera aktif" : "Memuat..."}
            </span>
          </div>
        )}
      </div>

      {/* ── Viewport ── */}
      <div className="flex-1 relative flex flex-col items-center justify-center min-h-0 overflow-hidden">
        {/* Video / image area — fills available space */}
        <div className="relative w-full h-full">

          {/* Camera mode */}
          {mode === "camera" && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                playsInline muted autoPlay
              />

              {/* Face guide corners */}
              {cameraReady && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative" style={{ width: "55%", aspectRatio: "3/4" }}>
                    {/* Top-left */}
                    <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 rounded-tl" style={{ borderColor: "#3B82F6" }} />
                    {/* Top-right */}
                    <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "#3B82F6" }} />
                    {/* Bottom-left */}
                    <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "#3B82F6" }} />
                    {/* Bottom-right */}
                    <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 rounded-br" style={{ borderColor: "#3B82F6" }} />

                    {/* Face detected label */}
                    <div
                      className="absolute top-[-28px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#60A5FA" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Wajah terdeteksi
                    </div>
                  </div>
                </div>
              )}

              {!cameraReady && !error && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60 mx-auto mb-3" />
                    <p className="text-sm">Mengaktifkan kamera...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Upload mode */}
          {mode === "upload" && (
            <>
              {uploadedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={uploadedImageRef}
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                  style={{ backgroundColor: "#111" }}
                  onLoad={() => setUploadImageLoaded(true)}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm font-medium">Klik untuk upload gambar</p>
                  <p className="text-xs mt-1 opacity-70">JPG/PNG, max 3MB</p>
                </div>
              )}
            </>
          )}

          {/* Upload loading */}
          {uploadLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-2 text-sm text-white/70">Memuat gambar...</p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6 text-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
              <svg className="w-10 h-10 mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={() => { setError(null); setCameraReady(false); setMode("camera"); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#3B82F6" }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="mt-3 text-sm font-medium text-white">{processingLabel}</p>
            </div>
          )}
        </div>

        {/* ── Bottom bar: hint + capture button ── */}
        <div
          className="w-full flex items-center justify-center gap-4 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Tekan untuk menganalisis
          </span>

          <button
            disabled={captureDisabled}
            onClick={handleCapture}
            aria-label="Capture and analyze"
            className="flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40"
            style={{
              width: 52,
              height: 52,
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(59,130,246,0.6)",
            }}
          >
            {isProcessing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} style={{ color: "#60A5FA" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload image"
        disabled={uploadLoading || isProcessing}
      />
    </div>
  );
}
