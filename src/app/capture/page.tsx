'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  name: string;
  age: string;
  email: string;
  phone: string;
}

interface SkinScores {
  oily: number;
  dry: number;
  normal: number;
  acne: number;
}

interface Recommendation {
  id: number;
  name: string;
  brand: string;
  description: string;
  image_url: string;
  score: number;
}

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'form' | 'capture' | 'analyzing' | 'results'>('form');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', age: '', email: '', phone: '' });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [skinScores, setSkinScores] = useState<SkinScores | null>(null);
  const [dominantCondition, setDominantCondition] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name || !userInfo.age) {
      setError('Name and age are required');
      return;
    }
    setError('');
    setStep('capture');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please use file upload instead.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        analyzeFace(canvas);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('File size must be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              setCapturedImage(event.target?.result as string);
              analyzeFace(canvas);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFace = async (canvas: HTMLCanvasElement) => {
    setStep('analyzing');
    setError('');

    try {
      // Simple heuristic-based skin analysis
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      let totalSaturation = 0;
      let totalRedness = 0;
      let pixelCount = 0;

      // Sample pixels from face region (center 60%)
      const startX = Math.floor(canvas.width * 0.2);
      const endX = Math.floor(canvas.width * 0.8);
      const startY = Math.floor(canvas.height * 0.2);
      const endY = Math.floor(canvas.height * 0.8);

      for (let y = startY; y < endY; y += 5) {
        for (let x = startX; x < endX; x += 5) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate brightness (V in HSV)
          const brightness = Math.max(r, g, b) / 255;
          totalBrightness += brightness;

          // Calculate saturation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          totalSaturation += saturation;

          // Calculate redness
          const redness = r / (g + b + 1);
          totalRedness += redness;

          pixelCount++;
        }
      }

      const avgBrightness = totalBrightness / pixelCount;
      const avgSaturation = totalSaturation / pixelCount;
      const avgRedness = totalRedness / pixelCount;

      // Heuristic scoring
      const oilyScore = Math.min(avgBrightness * 1.2, 1);
      const dryScore = Math.min((1 - avgSaturation) * 1.3, 1);
      const normalScore = Math.min(1 - Math.abs(avgSaturation - 0.5) * 2, 1);
      const acneScore = Math.min(avgRedness * 0.8, 1);

      const scores: SkinScores = {
        oily: parseFloat(oilyScore.toFixed(3)),
        dry: parseFloat(dryScore.toFixed(3)),
        normal: parseFloat(normalScore.toFixed(3)),
        acne: parseFloat(acneScore.toFixed(3))
      };

      setSkinScores(scores);

      // Send to backend for recommendations
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: userInfo.name,
          user_email: userInfo.email || null,
          user_phone: userInfo.phone || null,
          user_age: parseInt(userInfo.age),
          oily_score: scores.oily,
          dry_score: scores.dry,
          normal_score: scores.normal,
          acne_score: scores.acne
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const result = await response.json();
      setDominantCondition(result.dominant_condition);
      setRecommendations(result.recommendations);
      setStep('results');
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
      setStep('capture');
    }
  };

  const resetAnalysis = () => {
    setCapturedImage(null);
    setSkinScores(null);
    setRecommendations([]);
    setStep('form');
    setUserInfo({ name: '', age: '', email: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skin Analysis</h1>
          <p className="text-gray-600">Get personalized skincare recommendations</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'form' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Your Information</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={userInfo.age}
                  onChange={(e) => setUserInfo({ ...userInfo, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Capture
              </button>
            </form>
          </div>
        )}

        {step === 'capture' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Capture Your Face</h2>
            
            {!capturedImage && (
              <>
                <div className="mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-gray-900"
                  />
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={startCamera}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Camera
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    Capture Photo
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-4">Or upload a photo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Upload Photo
                  </button>
                </div>
              </>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Your Skin...</h2>
            <p className="text-gray-600">Please wait while we process your image</p>
          </div>
        )}

        {step === 'results' && skinScores && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
              
              {capturedImage && (
                <div className="mb-6">
                  <img src={capturedImage} alt="Captured" className="w-full max-w-md mx-auto rounded-lg" />
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Skin Condition Scores</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Oily</span>
                      <span>{(skinScores.oily * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${skinScores.oily * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Dry</span>
                      <span>{(skinScores.dry * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${skinScores.dry * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Normal</span>
                      <span>{(skinScores.normal * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${skinScores.normal * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Acne-Prone</span>
                      <span>{(skinScores.acne * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${skinScores.acne * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-lg">
                  <span className="font-semibold">Dominant Condition:</span>{' '}
                  <span className="text-blue-600 capitalize">{dominantCondition}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Top 3 Recommended Products</h2>
              <div className="space-y-4">
                {recommendations.map((product, index) => (
                  <div key={product.id} className="border rounded-lg p-4 flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-1">{product.brand}</p>
                      <p className="text-gray-700">{product.description}</p>
                      <p className="text-sm text-blue-600 mt-2">
                        Match Score: {(product.score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetAnalysis}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Analysis
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
