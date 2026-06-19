"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { analyzeSnapshot, snapshotFromVideo, AnalysisResult } from "@/lib/skinAnalyzer";
import { detectFaces, initializeFaceDetection, type FaceBoundingBox } from "@/lib/faceDetection";
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

// ── Live face bounding box (mirrored preview) ─────────────────────────────────
function FaceBBoxOverlay({ box, mirrored = true }: { box: FaceBoundingBox; mirrored?: boolean }) {
  const pad = 0.06;
  const x = Math.max(0, box.x - box.width * pad);
  const y = Math.max(0, box.y - box.height * pad);
  const w = Math.min(1 - x, box.width * (1 + 2 * pad));
  const h = Math.min(1 - y, box.height * (1 + 2 * pad));
  const left = (mirrored ? 1 - x - w : x) * 100;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${y * 100}%`,
          width: `${w * 100}%`,
          height: `${h * 100}%`,
          border: "2px solid #3B82F6",
          borderRadius: 6,
          boxShadow: "0 0 16px rgba(59,130,246,0.45)",
          transition: "left 0.12s ease, top 0.12s ease, width 0.12s ease, height 0.12s ease",
        }}
      />
    </div>
  );
}

// ── Corner markers for the viewfinder ────────────────────────────────────────
function ViewfinderBox({ active }: { active: boolean }) {
  const C = active ? "#3B82F6" : "rgba(255,255,255,0.35)";
  const cornerStyle = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: C,
    ...pos,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Box wrapper — 44% width, 3:4 aspect ratio, centered slightly above middle */}
      <div
        style={{
          position: "relative",
          width: "44%",
          aspectRatio: "3/4",
          marginTop: "-5%",
        }}
      >
        {/* Faint outline */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `1px solid ${active ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 4,
          }}
        />

        {/* Top-left corner */}
        <div style={cornerStyle({ top: -1, left: -1, borderTop: `2.5px solid`, borderLeft: `2.5px solid`, borderTopLeftRadius: 5 })} />
        {/* Top-right corner */}
        <div style={cornerStyle({ top: -1, right: -1, borderTop: `2.5px solid`, borderRight: `2.5px solid`, borderTopRightRadius: 5 })} />
        {/* Bottom-left corner */}
        <div style={cornerStyle({ bottom: -1, left: -1, borderBottom: `2.5px solid`, borderLeft: `2.5px solid`, borderBottomLeftRadius: 5 })} />
        {/* Bottom-right corner */}
        <div style={cornerStyle({ bottom: -1, right: -1, borderBottom: `2.5px solid`, borderRight: `2.5px solid`, borderBottomRightRadius: 5 })} />

        {/* Hint text below box */}
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            fontSize: 11,
            color: active ? "rgba(147,197,253,0.9)" : "rgba(255,255,255,0.4)",
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: "2px 10px",
            borderRadius: 20,
          }}
        >
          Posisikan wajah di dalam bingkai
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyResolved, setPrivacyResolved] = useState(false);
  const [liveFaceBox, setLiveFaceBox] = useState<FaceBoundingBox | null>(null);
  const liveDetectingRef = useRef(false);

  // ── Privacy consent sebelum akses kamera / model ─────────────────────────
  useEffect(() => {
    let mounted = true;

    Swal.fire({
      title: "Privacy & Data Usage",
      html: `<div style="text-align:left;line-height:1.6;font-size:14px;">
        <p>Website ini dibuat khusus untuk keperluan <b>demo Tugas Akhir</b>.</p>
        <p style="margin-top:8px">Sistem <b>tidak menyimpan foto, gambar wajah, atau data biometrik</b> pengguna.
        Seluruh proses pengolahan wajah dilakukan <b>secara langsung di browser</b> (client-side).</p>
        <p style="color:#6B7280;font-size:12px;margin-top:8px">Dengan melanjutkan, Anda memahami bahwa aplikasi ini hanya digunakan untuk keperluan akademik.</p>
      </div>`,
      icon: "info",
      confirmButtonText: "Saya Mengerti",
      confirmButtonColor: "#3B82F6",
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: 420,
      padding: "1.5rem",
    }).then((result) => {
      if (!mounted) return;
      if (result.isConfirmed) {
        setPrivacyAccepted(true);
        initializeFaceDetection().catch(() => {});
        loadSkinModel().catch(() => {});
      } else {
        setError("Anda perlu menyetujui kebijakan privasi untuk menggunakan kamera.");
      }
      setPrivacyResolved(true);
    });

    return () => { mounted = false; };
  }, []);

  // ── Camera lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!privacyAccepted || mode !== "camera") { stopStream(); return; }
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
  }, [mode, privacyAccepted]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!privacyAccepted || processingState !== "idle" || isAnalyzing) return;

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
  }, [privacyAccepted, mode, cameraReady, uploadImageLoaded, processingState, isAnalyzing, onCapture]);

  // ── File upload ───────────────────────────────────────────────────────────
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

  // ── Live face bbox pada preview kamera ────────────────────────────────────
  useEffect(() => {
    if (!privacyAccepted || !cameraReady || mode !== "camera" || isProcessing) {
      setLiveFaceBox(null);
      return;
    }

    const tick = async () => {
      const video = videoRef.current;
      if (!video || liveDetectingRef.current || isProcessing) return;
      liveDetectingRef.current = true;
      try {
        const result = await detectFaces(video);
        if (result.faceDetected && result.confidence >= 0.2 && result.boundingBox) {
          setLiveFaceBox(result.boundingBox);
        } else {
          setLiveFaceBox(null);
        }
      } catch {
        setLiveFaceBox(null);
      } finally {
        liveDetectingRef.current = false;
      }
    };

    const id = setInterval(() => { void tick(); }, 900);
    return () => { clearInterval(id); setLiveFaceBox(null); };
  }, [privacyAccepted, cameraReady, mode, isProcessing]);

  // ── Face bbox pada mode upload (tanpa mirror) ─────────────────────────────
  useEffect(() => {
    if (mode !== "upload" || !uploadImageLoaded || !uploadedImageRef.current || isProcessing) {
      if (mode !== "upload") setLiveFaceBox(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await detectFaces(uploadedImageRef.current!);
        if (!cancelled && result.faceDetected && result.boundingBox) {
          setLiveFaceBox(result.boundingBox);
        } else if (!cancelled) {
          setLiveFaceBox(null);
        }
      } catch {
        if (!cancelled) setLiveFaceBox(null);
      }
    })();

    return () => { cancelled = true; };
  }, [mode, uploadImageLoaded, uploadedImage, isProcessing]);

  const captureDisabled =
    !privacyAccepted || isProcessing || uploadLoading ||
    (mode === "camera" && !cameraReady) ||
    (mode === "upload" && !uploadedImage);

  const processingLabel =
    processingState === "detecting" ? "Mendeteksi wajah..." : "Menganalisis kulit...";

  // ── Render ────────────────────────────────────────────────────────────────
  // The panel fills 100% of its parent's height via flex — no overflow.
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#111113",
        overflow: "hidden",
      }}
    >
      {/* ── Top toolbar: mode toggle + status ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Kamera toggle */}
        <button
          onClick={() => { setMode("camera"); setUploadedImage(null); setError(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
            backgroundColor: mode === "camera" ? "rgba(255,255,255,0.11)" : "transparent",
            color: mode === "camera" ? "#F5F5F7" : "rgba(255,255,255,0.4)",
            border: mode === "camera" ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Kamera
        </button>

        {/* Upload toggle */}
        <button
          onClick={() => { setMode("upload"); setError(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
            backgroundColor: mode === "upload" ? "rgba(255,255,255,0.11)" : "transparent",
            color: mode === "upload" ? "#F5F5F7" : "rgba(255,255,255,0.4)",
            border: mode === "upload" ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </button>

        {/* Camera status */}
        {mode === "camera" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7, height: 7, borderRadius: "50%",
                backgroundColor: cameraReady ? "#22C55E" : "#6B7280",
                display: "inline-block",
                boxShadow: cameraReady ? "0 0 6px #22C55E" : "none",
              }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {cameraReady ? "Kamera aktif" : "Memuat kamera..."}
            </span>
          </div>
        )}
      </div>

      {/* ── Viewport: fills all remaining space ───────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>

        {/* ── CAMERA MODE ── */}
        {mode === "camera" && (
          <>
            {/* Video fills entire viewport with cover */}
            <video
              ref={videoRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
              playsInline
              muted
              autoPlay
            />

            {/* Viewfinder overlay — panduan posisi wajah */}
            {cameraReady && !isProcessing && !liveFaceBox && (
              <ViewfinderBox active={cameraReady} />
            )}

            {/* Bounding box wajah terdeteksi (live) */}
            {liveFaceBox && !isProcessing && <FaceBBoxOverlay box={liveFaceBox} />}

            {/* Camera loading state */}
            {!privacyAccepted && privacyResolved && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.5)", padding: 24, textAlign: "center",
              }}>
                <p style={{ fontSize: 13, marginBottom: 12 }}>Persetujuan privasi diperlukan untuk mengakses kamera.</p>
                <button
                  type="button"
                  onClick={() => {
                    Swal.fire({
                      title: "Privacy & Data Usage",
                      html: `<div style="text-align:left;line-height:1.6;font-size:14px;">
                        <p>Website ini dibuat khusus untuk keperluan <b>demo Tugas Akhir</b>.</p>
                        <p style="margin-top:8px">Sistem <b>tidak menyimpan foto, gambar wajah, atau data biometrik</b> pengguna.
                        Seluruh proses pengolahan wajah dilakukan <b>secara langsung di browser</b> (client-side).</p>
                      </div>`,
                      icon: "info",
                      confirmButtonText: "Saya Mengerti",
                      confirmButtonColor: "#3B82F6",
                    }).then((r) => {
                      if (r.isConfirmed) {
                        setPrivacyAccepted(true);
                        setError(null);
                        initializeFaceDetection().catch(() => {});
                        loadSkinModel().catch(() => {});
                      }
                    });
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: "#3B82F6", color: "#fff", border: "none", cursor: "pointer",
                  }}
                >
                  Tampilkan Kebijakan Privasi
                </button>
              </div>
            )}

            {!cameraReady && !error && privacyAccepted && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.15)", borderTop: "2px solid rgba(255,255,255,0.6)",
                  animation: "spin 0.9s linear infinite", marginBottom: 12,
                }} />
                <p style={{ fontSize: 13 }}>Mengaktifkan kamera...</p>
              </div>
            )}
          </>
        )}

        {/* ── UPLOAD MODE ── */}
        {mode === "upload" && (
          <>
            {uploadedImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={uploadedImageRef}
                  src={uploadedImage}
                  alt="Uploaded"
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#111",
                  }}
                  onLoad={() => setUploadImageLoaded(true)}
                />
                {liveFaceBox && !isProcessing && (
                  <FaceBBoxOverlay box={liveFaceBox} mirrored={false} />
                )}
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "absolute", inset: 0, cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <svg width="44" height="44" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ marginBottom: 12 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Klik untuk upload gambar</p>
                <p style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>JPG/PNG, maks. 3MB</p>
              </div>
            )}
          </>
        )}

        {/* Upload loading overlay */}
        {uploadLoading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 30,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff",
              animation: "spin 0.9s linear infinite", marginBottom: 10,
            }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Memuat gambar...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 30,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.87)", padding: 24, textAlign: "center",
          }}>
            <svg width="40" height="40" fill="none" stroke="#F87171" viewBox="0 0 24 24" strokeWidth={1.5} style={{ marginBottom: 12 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p style={{ fontSize: 13, color: "#F87171", marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => { setError(null); setCameraReady(false); setMode("camera"); }}
              style={{
                padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                backgroundColor: "#3B82F6", color: "#fff", cursor: "pointer", border: "none",
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 30,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.60)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff",
              animation: "spin 0.9s linear infinite", marginBottom: 12,
            }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{processingLabel}</p>
          </div>
        )}
      </div>

      {/* ── Bottom capture bar — always visible, never pushes layout ─────── */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "#111113",
        }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          {mode === "camera" ? "Tekan untuk menganalisis" : "Pilih gambar lalu analisis"}
        </span>

        {/* Capture button */}
        <button
          disabled={captureDisabled}
          onClick={handleCapture}
          aria-label="Capture dan analisis"
          style={{
            width: 52, height: 52,
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: captureDisabled ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.18)",
            border: `2px solid ${captureDisabled ? "rgba(255,255,255,0.1)" : "rgba(59,130,246,0.7)"}`,
            cursor: captureDisabled ? "not-allowed" : "pointer",
            opacity: captureDisabled ? 0.45 : 1,
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          {isProcessing ? (
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff",
              animation: "spin 0.9s linear infinite",
            }} />
          ) : (
            <svg width="24" height="24" fill="none" stroke="#60A5FA" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        {/* Upload trigger (upload mode only) */}
        {mode === "upload" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading || isProcessing}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 500,
              backgroundColor: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            Pilih File
          </button>
        )}
      </div>

      {/* Spin keyframe injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: "none" }}
        onChange={handleFileChange}
        aria-label="Upload image"
        disabled={uploadLoading || isProcessing}
      />
    </div>
  );
}
