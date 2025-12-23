'use client';

import { useEffect, useState } from 'react';

interface Product {
    id: number;
    name: string;
    brand: string;
    description: string;
    ingredients: string;
    image_url: string;
    w_oily: number;
    w_dry: number;
    w_normal: number;
    w_acne: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = filter === 'all'
        ? products
        : products.filter(p => {
            const key = `w_${filter}` as keyof Product;
            return (p[key] as number) > 0.3;
        });

    const skinTags = (product: Product) => {
        const tags: string[] = [];
        if (product.w_oily > 0.3) tags.push('Oily');
        if (product.w_dry > 0.3) tags.push('Dry');
        if (product.w_normal > 0.3) tags.push('Normal');
        if (product.w_acne > 0.3) tags.push('Acne');
        return tags;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B82F6]/30 border-t-[#3B82F6]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Filter & Products */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['all', 'oily', 'dry', 'normal', 'acne'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === f
                                    ? 'bg-[#3B82F6] text-white'
                                    : 'bg-white border border-[#E5E7EB] text-[#111]/70 hover:border-[#3B82F6]'
                                }`}
                        >
                            {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Product Image Placeholder */}
                            <div className="h-48 bg-gradient-to-br from-[#3B82F6]/10 to-[#3B82F6]/5 flex items-center justify-center">
                                <span className="text-5xl">🧴</span>
                            </div>

                            <div className="p-5">
                                {/* Brand & Name */}
                                <p className="text-xs font-medium text-[#3B82F6] uppercase tracking-wide">{product.brand}</p>
                                <h3 className="text-lg font-semibold text-[#111] mt-1">{product.name}</h3>

                                {/* Description */}
                                <p className="text-sm text-[#111]/60 mt-2 line-clamp-2">{product.description}</p>

                                {/* Skin Type Tags */}
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {skinTags(product).map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 bg-[#111]/5 text-[#111]/70 text-xs rounded"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Ingredients Preview */}
                                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                                    <p className="text-xs text-[#111]/40 uppercase tracking-wide">Kandungan Utama</p>
                                    <p className="text-sm text-[#111]/70 mt-1 line-clamp-1">{product.ingredients}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-[#111]/50">Tidak ada produk untuk filter ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
