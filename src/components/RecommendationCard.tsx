"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  brand: string | null;
  description: string | null;
}

interface Props {
  skinType: string;
  recommendations?: Product[] | null;
}

export default function RecommendationCard({ skinType, recommendations }: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pakai rekomendasi dari parent (save-from-scan) bila ada
    if (Array.isArray(recommendations)) {
      setItems(recommendations.map(p => ({ ...p, brand: p.brand ?? '' })));
      setLoading(false);
      return;
    }

    // Fallback: fetch dari API bila rekomendasi belum tersedia
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch products");
        const products = await res.json();
        setItems((products as Product[]).slice(0, 3).map(p => ({ ...p, brand: p.brand ?? '' })));
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, [skinType, recommendations]);

  return (
    <section className="flex-1 rounded-xl border border-[#E5E7EB] bg-white p-4">
      <h2 className="text-sm font-semibold text-[#111]">Rekomendasi Sabun Wajah</h2>
      <p className="text-xs text-[#111]/50">Untuk kulit {skinType}</p>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#111]/50">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6]"></div>
            <span>Memuat rekomendasi...</span>
          </div>
        ) : items.length > 0 ? (
          items.map((p) => (
            <article key={p.id} className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3h6l2 4H7l2-4z" />
                  <path d="M7 7v10a2 2 0 002 2h6a2 2 0 002-2V7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111]">{p.name}</p>
                <p className="text-xs text-[#111]/50">{p.brand}</p>
                <p className="mt-1 text-xs text-[#111]/60 line-clamp-1">{p.description}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#E5E7EB] px-4 py-6 text-center text-xs text-[#111]/50">
            Belum ada rekomendasi.
          </div>
        )}
      </div>
    </section>
  );
}
