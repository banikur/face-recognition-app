"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onCapture: () => void;
}

export default function CameraPanel({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setReady(false);
      }
    };
    init();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/60 bg-gradient-to-b from-white to-zinc-50 p-5 shadow-md shadow-zinc-200/70">
      <div className="text-xs uppercase tracking-wide text-zinc-500">Live capture</div>
      <div className="mt-3 flex flex-1 flex-col rounded-2xl bg-zinc-100/80 p-2 shadow-inner shadow-white/60 min-h-0">
        <div className="relative flex-1 min-h-[320px] rounded-[20px] bg-zinc-900/10">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full rounded-[20px] object-cover"
            playsInline
            muted
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-zinc-500">
              Mengaktifkan kamera...
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 text-sm text-zinc-600 shadow-inner">
          <span className="text-xs uppercase tracking-wide text-emerald-500">{ready ? "Studio ready" : "Permintaan akses"}</span>
          <span className="text-xs text-zinc-400">720p locked</span>
        </div>
      </div>
      <div className="pt-4">
        <button
          disabled={!ready}
          onClick={onCapture}
          className="h-12 w-full rounded-full bg-gradient-to-r from-zinc-900 to-zinc-700 text-sm font-medium text-white shadow-lg shadow-zinc-900/20 transition hover:scale-[1.01] disabled:opacity-40"
        >
          Capture & Analyze
        </button>
      </div>
    </section>
  );
}
