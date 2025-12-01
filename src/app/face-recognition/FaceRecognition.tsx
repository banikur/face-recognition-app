'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FaceRecognition() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skinCondition, setSkinCondition] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.error('Error accessing camera:', err);
      const name = (typeof err === 'object' && err && 'name' in err) ? (err as { name?: string }).name : undefined;
      const errorMsg = name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions.'
        : name === 'NotFoundError'
        ? 'No camera found on this device.'
        : 'Could not access the camera. Please check permissions and device.';
      
      setCameraError(errorMsg);
      setError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    // In a real implementation, we would capture the image here
    // For this demo, we'll just simulate the analysis
    analyzeSkinCondition();
  };

  const analyzeSkinCondition = () => {
    setLoading(true);
    setError(null);
    
    // Simulate analysis delay
    setTimeout(() => {
      // In a real implementation, this would analyze the face image
      // For now, we'll simulate with random results
      const conditions = ['Oily', 'Dry', 'Normal', 'Combination', 'Acne-prone'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      setSkinCondition(randomCondition);
      setAnalysisComplete(true);
      setLoading(false);
      
      // Stop camera after analysis
      stopCamera();
    }, 1500);
  };

  const getRecommendations = () => {
    if (skinCondition) {
      router.push(`/recommendations?condition=${skinCondition}`);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl w-full h-96 flex items-center justify-center bg-gray-50 overflow-hidden">
        {cameraActive && videoRef.current?.srcObject ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : cameraError ? (
          <div className="text-center p-4">
            <div className="mx-auto bg-red-100 border-2 border-red-300 rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-500 font-medium">{cameraError}</p>
            <p className="text-sm text-gray-500 mt-1">Please check your browser permissions and try again</p>
          </div>
        ) : (
          <div className="text-center p-4">
            <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Camera preview will appear here</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Start Camera&quot; to begin</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {!cameraActive && !analysisComplete && (
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Start Camera
          </button>
        )}
        
        {cameraActive && !analysisComplete && (
          <>
            <button
              onClick={captureImage}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Capture & Analyze
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Stop Camera
            </button>
          </>
        )}
        
        {analysisComplete && (
          <button
            onClick={getRecommendations}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Get Product Recommendations
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <p className="text-gray-600">Analyzing skin condition...</p>
          <div className="mt-2 w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      )}

      {error && !cameraError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {skinCondition && !loading && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Results</h2>
          <p className="text-lg text-gray-600">
            Your skin condition is detected as: <span className="font-semibold text-blue-600">{skinCondition}</span>
          </p>
          <div className="mt-4">
            <button
              onClick={getRecommendations}
              className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Get Product Recommendations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
