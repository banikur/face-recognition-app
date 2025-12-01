'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllProducts, getProductsBySkinTypeId, createAnalysisLog } from '@/data/models';

interface Product {
  id: number;
  name: string;
  brand: string;
  skin_type_id: number;
  description: string;
  ingredients: string;
}

export default function Recommendations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skinCondition = searchParams.get('condition');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skinCondition) {
      router.push('/face-recognition');
      return;
    }

    // Map skin condition to skin type ID
    const skinTypeMap: Record<string, number> = {
      'Oily': 1,
      'Dry': 2,
      'Normal': 3,
      'Combination': 4,
      'Acne-prone': 5
    };

    const skinTypeId = skinTypeMap[skinCondition] || 3; // Default to Normal

    try {
      // Get products for the detected skin type
      const recommendedProducts = getProductsBySkinTypeId(skinTypeId);
      setProducts(recommendedProducts);

      // Save analysis log (for guest user, user_id is null)
      createAnalysisLog({
        user_id: null,
        skin_condition_detected: skinCondition,
        recommended_product_id: recommendedProducts.length > 0 ? recommendedProducts[0].id : 0
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [skinCondition, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <p>Loading recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Recommendations</h1>
          <p className="text-gray-600">
            Based on your <span className="font-semibold text-blue-600">{skinCondition}</span> skin condition
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                      <p className="text-gray-600">{product.brand}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-3 text-gray-600">{product.description}</p>
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Key Ingredients:</h4>
                    <p className="text-gray-600 text-sm">{product.ingredients}</p>
                  </div>
                  <div className="mt-6">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600">No recommendations found for your skin condition.</p>
            <button
              onClick={() => router.push('/face-recognition')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/face-recognition')}
            className="px-4 py-2 text-blue-600 font-medium rounded-lg hover:text-blue-800 focus:outline-none"
          >
            ← Back to Analysis
          </button>
        </div>
      </div>
    </div>
  );
}