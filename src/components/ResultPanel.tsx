"use client";

interface Scores {
  acne: number;
  blackheads: number;
  clear_skin: number;
  dark_spots: number;
  puffy_eyes: number;
  wrinkles: number;
}

interface Props {
  skinType: string | null;
  scores: Scores | null;
  isAnalyzing?: boolean;
  faceDetected?: boolean;
}

export default function ResultPanel({ skinType, scores, isAnalyzing = false, faceDetected }: Props) {
  const scoreEntries = [
    { label: "Acne", key: "acne", color: "#EF4444" },
    { label: "Blackheads", key: "blackheads", color: "#6B7280" },
    { label: "Clear Skin", key: "clear_skin", color: "#10B981" },
    { label: "Dark Spots", key: "dark_spots", color: "#8B5CF6" },
    { label: "Puffy Eyes", key: "puffy_eyes", color: "#F59E0B" },
    { label: "Wrinkles", key: "wrinkles", color: "#3B82F6" },
  ] as const;

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#111]">Hasil Analisis</h2>

      {isAnalyzing ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-[#111]/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6]"></div>
          <span>Menganalisis kondisi kulit...</span>
        </div>
      ) : skinType && faceDetected ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-[#111]/50">Kondisi Utama</span>
            <span className="rounded-full bg-[#3B82F6] px-3 py-1 text-xs font-medium text-white">
              {skinType}
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs text-[#111]/50">Skor Analisis</span>
            <ul className="mt-2 space-y-2">
              {scoreEntries.map(({ label, key, color }) => {
                const value = scores?.[key as keyof Scores] ?? 0;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-[#111]/70">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${value}%`, backgroundColor: color }}
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
