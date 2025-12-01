'use client';

import FaceRecognition from '@/app/face-recognition/FaceRecognition';

export default function FaceRecognitionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Face Recognition Analysis</h1>
          <p className="text-gray-600">
            Capture your face image and get personalized skin condition analysis
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <FaceRecognition />
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>In a full implementation, this would use advanced face recognition algorithms to analyze facial features and determine skin conditions.</p>
          <p className="mt-2">For this demo, click &quot;Start Camera&quot; to begin, then &quot;Capture &amp; Analyze&quot; to simulate the analysis.</p>
        </div>
      </div>
    </div>
  );
}
