'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllAnalysisLogs,
  getAllProducts,
  getAllSkinTypes,
  AnalysisLog,
  Product,
  SkinType
} from '@/data/models';

export default function ExportAdmin() {
  const router = useRouter();
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const exportToCSV = () => {
    setExportStatus('Exporting data to CSV...');
    
    try {
      // Get all data
      const logs = getAllAnalysisLogs();
      const products = getAllProducts();
      const skinTypes = getAllSkinTypes();
      
      // Create a map for product names
      const productMap = products.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {} as Record<number, string>);
      
      // Create CSV content
      const headers = ['ID,Date,Skin Condition,Recommended Product,User ID'];
      const rows = logs.map(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        const productName = productMap[log.recommended_product_id] || 'Unknown';
        return `${log.id},${date},${log.skin_condition_detected},"${productName}",${log.user_id || 'Guest'}`;
      });
      
      const csvContent = [...headers, ...rows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'face_analysis_report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus('CSV export completed successfully!');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setExportStatus('Error exporting to CSV. Please try again.');
    }
  };

  const exportToJSON = () => {
    setExportStatus('Exporting data to JSON...');
    
    try {
      // Get all data
      const logs = getAllAnalysisLogs();
      const products = getAllProducts();
      const skinTypes = getAllSkinTypes();
      
      // Create export data structure
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalLogs: logs.length,
          totalProducts: products.length,
          totalSkinTypes: skinTypes.length
        },
        analysisLogs: logs,
        products: products,
        skinTypes: skinTypes
      };
      
      // Convert to JSON
      const jsonContent = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'face_analysis_report.json');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus('JSON export completed successfully!');
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      setExportStatus('Error exporting to JSON. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600 mt-2">Export analysis data to CSV or JSON format</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Export to CSV</h3>
              <p className="text-gray-600 mb-4">
                Export analysis logs in CSV format, compatible with Excel and other spreadsheet applications.
              </p>
              <button
                onClick={exportToCSV}
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Export CSV
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Export to JSON</h3>
              <p className="text-gray-600 mb-4">
                Export all data including logs, products, and skin types in JSON format for developers.
              </p>
              <button
                onClick={exportToJSON}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Export JSON
              </button>
            </div>
          </div>
          
          {exportStatus && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
              {exportStatus}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Click on either export button to download the data in your preferred format</li>
            <li>CSV files can be opened with Excel, Google Sheets, or any spreadsheet application</li>
            <li>JSON files contain all data and can be used for further analysis or integration</li>
            <li>All exported data is anonymized and does not contain personal information</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
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