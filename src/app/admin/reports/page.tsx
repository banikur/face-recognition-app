'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllAnalysisLogs,
  getAllProducts,
  getAllSkinTypes,
  AnalysisLog,
  Product,
  SkinType
} from '@/data/models';

export default function ReportsAdmin() {
  const router = useRouter();
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    skinCondition: '',
    productId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    try {
      const logsData = getAllAnalysisLogs();
      const productsData = getAllProducts();
      const skinTypesData = getAllSkinTypes();
      setLogs(logsData);
      setProducts(productsData);
      setSkinTypes(skinTypesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const getProductName = (id: number) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Unknown';
  };

  const getSkinTypeName = (name: string) => {
    const skinType = skinTypes.find(st => st.name === name);
    return skinType ? skinType.name : name;
  };

  // Generate reports
  const generateMostRecommendedReport = () => {
    const productCount: Record<number, number> = {};
    
    logs.forEach(log => {
      if (productCount[log.recommended_product_id]) {
        productCount[log.recommended_product_id]++;
      } else {
        productCount[log.recommended_product_id] = 1;
      }
    });

    const sortedProducts = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, count]) => ({
        product: getProductName(parseInt(productId)),
        count
      }));

    return sortedProducts;
  };

  const generateMostCommonSkinTypes = () => {
    const skinTypeCount: Record<string, number> = {};
    
    logs.forEach(log => {
      if (skinTypeCount[log.skin_condition_detected]) {
        skinTypeCount[log.skin_condition_detected]++;
      } else {
        skinTypeCount[log.skin_condition_detected] = 1;
      }
    });

    const sortedSkinTypes = Object.entries(skinTypeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([skinType, count]) => ({
        skinType,
        count
      }));

    return sortedSkinTypes;
  };

  const mostRecommendedProducts = generateMostRecommendedReport();
  const mostCommonSkinTypes = generateMostCommonSkinTypes();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Reports</h1>
          <p className="text-gray-600 mt-2">View reports and statistics from face analysis</p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filter Analysis Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="skinCondition" className="block text-sm font-medium text-gray-700 mb-1">
                Skin Condition
              </label>
              <select
                id="skinCondition"
                name="skinCondition"
                value={filter.skinCondition}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Conditions</option>
                {skinTypes.map(skinType => (
                  <option key={skinType.id} value={skinType.name}>
                    {skinType.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                id="productId"
                name="productId"
                value={filter.productId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Reports Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Most Recommended Products */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Recommended Products</h2>
            {mostRecommendedProducts.length > 0 ? (
              <div className="space-y-4">
                {mostRecommendedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 font-bold rounded-full mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.product}</span>
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      {item.count} recommendations
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>

          {/* Most Common Skin Types */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Common Skin Types</h2>
            {mostCommonSkinTypes.length > 0 ? (
              <div className="space-y-4">
                {mostCommonSkinTypes.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-800 font-bold rounded-full mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.skinType}</span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                      {item.count} analyses
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Analysis Logs Table */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Logs</h2>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading analysis logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skin Condition
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recommended Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.skin_condition_detected}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getProductName(log.recommended_product_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.user_id ? log.user_id : 'Guest'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:text-gray-900 focus:outline-none"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}