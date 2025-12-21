"use client";

interface Scores {
  oily: number;
  dry: number;
  normal: number;
  acne: number;
}

interface Props {
  skinType: string | null;
  scores: Scores | null;
  isAnalyzing?: boolean;
  faceDetected?: boolean;
}

export default function ResultPanel({ skinType, scores, isAnalyzing = false, faceDetected }: Props) {
  const scoreEntries = [
    { label: "Oily", key: "oily" },
    { label: "Dry", key: "dry" },
    { label: "Normal", key: "normal" },
    { label: "Acne", key: "acne" },
  ] as const;

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#111]">Hasil Terpilih</h2>

      {isAnalyzing ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-[#111]/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6]"></div>
          <span>Menganalisis dengan MediaPipe...</span>
        </div>
      ) : skinType && faceDetected ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-[#111]/50">Skin Type</span>
            <span className="rounded-full bg-[#3B82F6] px-3 py-1 text-xs font-medium text-white">
              {skinType}
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs text-[#111]/50">Score Layers</span>
            <ul className="mt-2 space-y-2">
              {scoreEntries.map(({ label, key }) => {
                const value = scores?.[key] ?? 0;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="w-14 text-xs text-[#111]/70">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-2 rounded-full bg-[#3B82F6] transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-[#111]">
                      {`${value}%`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : skinType && !faceDetected ? (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <p className="font-medium">Wajah tidak terdeteksi</p>
          <p className="text-xs mt-1">Pastikan wajah terlihat jelas di kamera</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#111]/40">
          Tekan tombol capture untuk memulai analisis AI
        </p>
      )}
    </section>
  );
}
