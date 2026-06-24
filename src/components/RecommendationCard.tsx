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
        style={{ color: "#94A3B8" }}
      >
        Rekomendasi Produk
      </p>

      {skinType ? (
        <p className="text-xs mb-4" style={{ color: "#64748B" }}>
          Untuk kulit {skinType}
        </p>
      ) : (
        <p className="text-xs mb-4" style={{ color: "#94A3B8" }}>
          Hasil analisis akan muncul setelah capture
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-400" />
          <span className="text-sm" style={{ color: "#64748B" }}>
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
                backgroundColor: "#F1F5F9",
                border: "1px solid #E2E8F0",
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C12 2 5 9.5 5 14a7 7 0 0014 0c0-4.5-7-12-7-12z" />
                </svg>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: "#0F172A" }}
                >
                  {p.name}
                </p>
                {p.brand && (
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                    {p.brand}
                  </p>
                )}
                {p.description && (
                  <p
                    className="text-xs mt-1.5 line-clamp-2"
                    style={{ color: "#64748B" }}
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
            backgroundColor: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            color: "#94A3B8",
          }}
        >
          Belum ada rekomendasi produk.
        </div>
      ) : null}
    </div>
  );
}

