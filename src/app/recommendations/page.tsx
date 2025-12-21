'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  ingredients: string;
  w_oily: number;
  w_dry: number;
  w_normal: number;
  w_acne: number;
}

export default function Recommendations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skinCondition = searchParams.get('condition');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skinCondition) {
      router.push('/');
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const allProducts: Product[] = await res.json();

        // Sort by weight matching skin condition
        const conditionKey = `w_${skinCondition.toLowerCase()}` as keyof Product;
        const sorted = allProducts
          .filter(p => typeof p[conditionKey] === 'number' && (p[conditionKey] as number) > 0)
          .sort((a, b) => (b[conditionKey] as number) - (a[conditionKey] as number))
          .slice(0, 6); // Top 6

        setProducts(sorted);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [skinCondition, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B82F6]/30 border-t-[#3B82F6] mx-auto"></div>
          <p className="mt-3 text-[#111]/60">Memuat rekomendasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#111]">Rekomendasi Produk</h1>
          <p className="text-[#111]/60 mt-1">
            Untuk kulit <span className="font-semibold text-[#3B82F6]">{skinCondition}</span>
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#111]">{product.name}</h3>
                    <p className="text-sm text-[#111]/60">{product.brand}</p>
                  </div>
                  <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-medium px-2 py-1 rounded">
                    Match
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#111]/70">{product.description}</p>
                <div className="mt-3">
                  <p className="text-xs text-[#111]/50">Ingredients:</p>
                  <p className="text-xs text-[#111]/70 line-clamp-2">{product.ingredients}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
            <p className="text-[#111]/60">Tidak ada rekomendasi untuk kondisi kulit ini.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-[#3B82F6] font-medium hover:text-[#2563EB]"
          >
            ← Kembali ke Analisis
          </button>
        </div>
      </div>
    </div>
  );
}