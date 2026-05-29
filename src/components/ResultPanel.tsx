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
  confidence?: number;
  isAnalyzing?: boolean;
  faceDetected?: boolean;
}

const SCORE_ENTRIES = [
  { label: "Acne",       key: "acne",        color: "#EF4444" },
  { label: "Blackheads", key: "blackheads",   color: "#9CA3AF" },
  { label: "Clear skin", key: "clear_skin",   color: "#22C55E" },
  { label: "Dark spots", key: "dark_spots",   color: "#A78BFA" },
  { label: "Puffy eyes", key: "puffy_eyes",   color: "#F59E0B" },
  { label: "Wrinkles",   key: "wrinkles",     color: "#3B82F6" },
] as const;

export default function ResultPanel({
  skinType,
  scores,
  confidence,
  isAnalyzing = false,
  faceDetected,
}: Props) {
  return (
    <div
      className="flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Section: Hasil Analisis ── */}
      <div className="px-5 pt-5 pb-4">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Hasil Analisis
        </p>

        {isAnalyzing ? (
          <div className="flex items-center gap-2.5 py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Menganalisis kondisi kulit...
            </span>
          </div>
        ) : skinType && faceDetected ? (
          <div className="flex items-center justify-between gap-3">
            {/* Dominant condition badge */}
            <span
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: "#3B82F6", color: "#fff" }}
            >
              {skinType}
            </span>

            {/* Confidence badge */}
            {confidence != null && (
              <span
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ADE80" }}
              >
                {confidence}% confidence
              </span>
            )}
          </div>
        ) : skinType && !faceDetected ? (
          <div
            className="rounded-lg px-3 py-2.5 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#F87171" }}
          >
            <p className="font-medium">Wajah tidak terdeteksi</p>
            <p className="text-xs mt-0.5 opacity-75">Pastikan wajah terlihat jelas di kamera</p>
          </div>
        ) : (
          <p className="text-sm py-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Tekan tombol capture untuk memulai analisis
          </p>
        )}
      </div>

      {/* ── Section: Skor per Kondisi ── */}
      {scores && faceDetected && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mt-4 mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Skor per Kondisi
          </p>

          <ul className="space-y-2.5">
            {SCORE_ENTRIES.map(({ label, key, color }) => {
              const value = scores[key as keyof Scores] ?? 0;
              return (
                <li key={key} className="flex items-center gap-3">
                  <span
                    className="w-[88px] text-xs flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {label}
                  </span>

                  {/* Track */}
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${value}%`, backgroundColor: color }}
                    />
                  </div>

                  <span
                    className="w-9 text-right text-xs font-semibold flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {value}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
