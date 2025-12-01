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
}

export default function ResultPanel({ skinType, scores }: Props) {
  const scoreEntries = [
    { label: "Oily", key: "oily" },
    { label: "Dry", key: "dry" },
    { label: "Normal", key: "normal" },
    { label: "Acne", key: "acne" },
  ] as const;

  return (
    <section className="rounded-2xl border border-white/60 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-md shadow-zinc-200/80">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Skin analyzer</div>
          <h2 className="text-xl font-semibold text-zinc-900">Hasil terpilih</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-600 shadow-inner">Live</span>
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-5 rounded-2xl bg-white/80 p-4 shadow-inner">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Skin type</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{skinType ?? "—"}</p>
          <p className="mt-1 text-sm text-zinc-500">Akurasi realtime dari kamera</p>
        </div>
        <div className="col-span-7 rounded-2xl bg-white/80 p-4 shadow-inner">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Score layers</p>
          <ul className="mt-3 space-y-3">
            {scoreEntries.map(({ label, key }) => {
              const value = scores?.[key] ?? 0;
              return (
                <li key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-zinc-600">
                    <span>{label}</span>
                    <span className="font-medium text-zinc-900">{scores ? `${value}%` : "—"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-500 transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
