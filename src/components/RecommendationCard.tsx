"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
  image_url?: string | null;
}

interface Props {
  skinType: string | null;
  recommendations?: Product[] | null;
}

export default function RecommendationCard({ skinType, recommendations }: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(recommendations)) {
      setItems(recommendations.map((p) => ({ ...p, brand: p.brand ?? "" })));
      setLoading(false);
      return;
    }

    if (!skinType) {
      setItems([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        const products = await res.json();
        setItems((products as Product[]).slice(0, 3).map((p) => ({ ...p, brand: p.brand ?? "" })));
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, [skinType, recommendations]);

  return (
    <div className="flex-1 px-5 pt-5 pb-6 overflow-y-auto">
      <p
        className="text-[10px] font-semibold tracking-widest uppercase mb-1"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Rekomendasi Produk
      </p>

      {skinType ? (
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
          Untuk kulit {skinType}
        </p>
      ) : (
        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
          Hasil analisis akan muncul setelah capture
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Memuat rekomendasi...
          </span>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((p) => (
            <article
              key={p.id}
              className="flex items-start gap-3 rounded-xl p-3.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  style={{ color: "#60A5FA" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l2 4H7l2-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                </svg>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "#F5F5F7" }}
                >
                  {p.name}
                </p>
                {p.brand && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {p.brand}
                  </p>
                )}
                {p.description && (
                  <p
                    className="text-xs mt-1.5 line-clamp-2"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {p.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : skinType ? (
        <div
          className="rounded-xl px-4 py-6 text-center text-xs"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          Belum ada rekomendasi produk.
        </div>
      ) : null}
    </div>
  );
}
