"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeSkin, AnalysisResult } from "@/lib/skinAnalyzer";

interface Props {
  onCapture: (result: AnalysisResult) => void;
  isAnalyzing?: boolean;
}

type InputMode = 'camera' | 'upload';

export default function CameraPanel({ onCapture, isAnalyzing = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<InputMode>('camera');
  const [cameraReady, setCameraReady] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'camera') return;

    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('Camera init error:', err);
        setError('Gagal mengakses kamera');
        setCameraReady(false);
      }
    };

    initCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  const handleCapture = async () => {
    if (mode === 'camera' && videoRef.current && cameraReady) {
      const result = await analyzeSkin(videoRef.current);
      saveToDataset(result);
      onCapture(result);
    } else if (mode === 'upload' && uploadedImage && canvasRef.current) {
      // Analyze uploaded image
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Create a fake video-like object for analyzer
        const result = await analyzeFromCanvas(canvas);
        saveToDataset(result);
        onCapture(result);
      };
      img.src = uploadedImage;
    }
  };

  const analyzeFromCanvas = async (canvas: HTMLCanvasElement): Promise<AnalysisResult> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { skinType: 'Error', scores: { oily: 0, dry: 0, normal: 0, acne: 0 }, faceDetected: false };

    const size = Math.min(canvas.width, canvas.height);
    const sx = (canvas.width - size) / 2;
    const sy = (canvas.height - size) / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 128;
    tempCanvas.height = 128;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, sx, sy, size, size, 0, 0, 128, 128);

    const imageData = tempCtx.getImageData(0, 0, 128, 128);

    // Detect face
    let skinPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2];
      if (r > 60 && r < 255 && g > 40 && g < 230 && b > 20 && b < 200 && r > g && r > b) skinPixels++;
    }
    const faceDetected = (skinPixels / (128 * 128)) > 0.15;

    if (!faceDetected) {
      return { skinType: 'Unknown', scores: { oily: 0, dry: 0, normal: 0, acne: 0 }, faceDetected: false };
    }

    // Analyze features
    let totalBrightness = 0, totalRedness = 0, totalSat = 0;
    const brightnessVals: number[] = [];
    const total = 128 * 128;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      brightnessVals.push(brightness);
      totalBrightness += brightness;
      totalRedness += Math.max(0, (r - g) / 255);
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      totalSat += max === 0 ? 0 : (max - min) / max;
    }

    const avgB = totalBrightness / total;
    const avgR = totalRedness / total;
    const avgS = totalSat / total;
    let variance = 0;
    for (const b of brightnessVals) variance += (b - avgB) ** 2;
    variance = Math.sqrt(variance / total);

    const scores = {
      acne: Math.round(Math.min(100, Math.max(0, avgR * 250 + (variance > 30 ? 20 : 0)))),
      normal: Math.round(Math.min(100, Math.max(0, 70 - Math.abs(avgB - 128) * 0.3 + avgS * 30))),
      oily: Math.round(Math.min(100, Math.max(0, (avgB / 255) * 50 + (1 - variance / 80) * 50))),
      dry: Math.round(Math.min(100, Math.max(0, (1 - avgS) * 50 + (variance / 80) * 50))),
    };

    const entries = Object.entries(scores) as [keyof typeof scores, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const skinType = entries[0][0].charAt(0).toUpperCase() + entries[0][0].slice(1);

    return { skinType, scores, faceDetected: true, imageData: tempCanvas.toDataURL('image/jpeg', 0.8) };
  };

  const saveToDataset = async (result: AnalysisResult) => {
    if (result.faceDetected && result.imageData) {
      try {
        await fetch('/api/dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: result.imageData, scores: result.scores, skinType: result.skinType }),
        });
      } catch (e) { console.error('Failed to save:', e); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('camera'); setUploadedImage(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${mode === 'camera' ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#111]/70'
              }`}
          >
            📷 Kamera
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${mode === 'upload' ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#111]/70'
              }`}
          >
            📁 Upload
          </button>
        </div>
        <span className="text-xs text-[#111]/40">
          {mode === 'camera' ? 'Live Capture' : 'Upload Gambar'}
        </span>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 overflow-hidden rounded-lg bg-[#111]">
        {mode === 'camera' ? (
          <>
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
            {!cameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                Mengaktifkan kamera...
              </div>
            )}
          </>
        ) : (
          <>
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded" className="absolute inset-0 h-full w-full object-contain bg-black" />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex flex-col items-center justify-center text-white/60 cursor-pointer hover:text-white/80 transition"
              >
                <span className="text-4xl mb-2">📷</span>
                <span className="text-sm">Klik untuk upload gambar</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400">
            {error}
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            <p className="mt-3 text-sm font-medium text-white">Menganalisis kulit...</p>
          </div>
        )}

        {/* Hidden canvas for upload analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture/Analyze Button */}
        <button
          disabled={isAnalyzing || (mode === 'camera' && !cameraReady) || (mode === 'upload' && !uploadedImage)}
          onClick={handleCapture}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#3B82F6] text-white shadow-lg transition hover:bg-[#2563EB] disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      </div>
    </section>
  );
}
