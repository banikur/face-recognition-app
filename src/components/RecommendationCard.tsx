"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
}

export default function RecommendationCard() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch products");
        const products: Product[] = await res.json();
        setItems(products.slice(0, 3));
      } catch {
        setItems([]);
      }
    };
    load();
  }, []);

  return (
    <section className="flex-1 rounded-2xl border border-white/60 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-md shadow-zinc-200/80">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Rekomendasi sabun muka</p>
          <h2 className="text-xl font-semibold text-zinc-900">Kurasi ahli</h2>
        </div>
        <span className="text-xs text-zinc-500">Top 3</span>
      </div>
      <div className="flex flex-col gap-3">
        {items.length > 0 ? (
          items.map((p) => (
            <article key={p.id} className="rounded-2xl border border-zinc-100/80 bg-white/90 p-4 shadow-sm shadow-zinc-300/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{p.brand}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">Gentle</span>
              </div>
              <p className="mt-3 text-sm text-zinc-600 line-clamp-3">{p.description}</p>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-center text-sm text-zinc-500">
            Belum ada rekomendasi.
          </div>
        )}
      </div>
    </section>
  );
}
