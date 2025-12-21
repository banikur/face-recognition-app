'use client';

import { useEffect, useState } from 'react';
import { initializeFaceDetection } from '@/lib/faceDetection';

interface ModelLoaderProps {
  children: React.ReactNode;
}

export default function ModelLoader({ children }: ModelLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Initialize face detection model
        console.log('Initializing face detection model...');
        await initializeFaceDetection();
        console.log('Face detection model initialized successfully');
        
        // Add a small delay to ensure models are fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing models:', err);
        setError('Gagal memuat model deteksi wajah. Silakan refresh halaman.');
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Memuat model deteksi wajah...</p>
          <p className="text-sm text-gray-500 mt-2">Ini mungkin memakan waktu beberapa detik</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Memuat Model</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}