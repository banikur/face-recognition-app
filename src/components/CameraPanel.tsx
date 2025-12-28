"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeSkin, AnalysisResult } from "@/lib/skinAnalyzer";
import { detectFaces } from "@/lib/faceDetection";

interface Props {
  onCapture: (result: AnalysisResult) => void;
  isAnalyzing?: boolean;
}

type InputMode = 'camera' | 'upload';

export default function CameraPanel({ onCapture, isAnalyzing = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [mode, setMode] = useState<InputMode>('camera');
  const [cameraReady, setCameraReady] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [uploadImageLoaded, setUploadImageLoaded] = useState(false);

  // Helper function to get getUserMedia with fallbacks
  const getUserMediaWithFallback = (): ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    } else if ((navigator as any).getUserMedia) {
      return (constraints: MediaStreamConstraints) => {
        return new Promise((resolve, reject) => {
          (navigator as any).getUserMedia(constraints, resolve, reject);
        });
      };
    } else if ((navigator as any).webkitGetUserMedia) {
      return (constraints: MediaStreamConstraints) => {
        return new Promise((resolve, reject) => {
          (navigator as any).webkitGetUserMedia(constraints, resolve, reject);
        });
      };
    } else if ((navigator as any).mozGetUserMedia) {
      return (constraints: MediaStreamConstraints) => {
        return new Promise((resolve, reject) => {
          (navigator as any).mozGetUserMedia(constraints, resolve, reject);
        });
      };
    }
    return null;
  };

  useEffect(() => {
    // Initialize face detection model when component mounts
    const initializeModels = async () => {
      try {
        // This ensures the face detection model is pre-loaded
        // The actual initialization will happen when needed
        console.log('Face detection model is ready for use');
      } catch (error) {
        console.error('Error initializing face detection:', error);
      }
    };

    initializeModels();

    if (mode !== 'camera') {
      // Stop face detection loop when switching away from camera
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      setFaceBox(null);
      return;
    }

    let stream: MediaStream | null = null;

    // Real-time face detection loop
    const detectFaceLoop = async () => {
      if (!videoRef.current || !cameraReady || mode !== 'camera') {
        animationFrameId.current = requestAnimationFrame(detectFaceLoop);
        return;
      }

      try {
        const result = await detectFaces(videoRef.current);
        if (result.faceDetected && result.boundingBox) {
          const video = videoRef.current;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          // Convert normalized coordinates to pixel coordinates
          const box = {
            x: result.boundingBox.x * videoWidth,
            y: result.boundingBox.y * videoHeight,
            width: result.boundingBox.width * videoWidth,
            height: result.boundingBox.height * videoHeight
          };
          setFaceBox(box);
        } else {
          setFaceBox(null);
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }

      // Continue loop (throttled to ~10fps for performance)
      setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(detectFaceLoop);
      }, 100);
    };

    const initCamera = async () => {
      try {
        // Check if we're on HTTPS or localhost (required for getUserMedia)
        // Allow local IP addresses for development
        const isLocalhost = location.hostname === 'localhost' ||
          location.hostname === '127.0.0.1' ||
          location.hostname.startsWith('192.168.') ||
          location.hostname.startsWith('10.') ||
          location.hostname.startsWith('172.');

        const isSecureContext = window.isSecureContext ||
          location.protocol === 'https:' ||
          isLocalhost;

        if (!isSecureContext) {
          throw new Error('HTTPS_REQUIRED');
        }

        // Check if getUserMedia is available with fallback
        const getUserMedia = getUserMediaWithFallback();

        if (!getUserMedia) {
          throw new Error('getUserMedia tidak didukung di browser ini. Pastikan menggunakan browser modern (Chrome, Firefox, Safari)');
        }

        // Check if mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // More flexible constraints for mobile
        const constraints: MediaStreamConstraints = {
          video: isMobile ? {
            facingMode: { ideal: 'user' },
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          } : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        };

        stream = await getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Set attributes for mobile compatibility
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;

          try {
            await videoRef.current.play();
            setCameraReady(true);
            setError(null);
          } catch (playError) {
            console.error('Video play error:', playError);
            // Try to play again after a short delay
            setTimeout(async () => {
              if (videoRef.current) {
                try {
                  await videoRef.current.play();
                  setCameraReady(true);
                  setError(null);
                } catch (retryError) {
                  console.error('Video play retry error:', retryError);
                  setError('Gagal memutar video kamera');
                  setCameraReady(false);
                }
              }
            }, 100);
          }
        }
      } catch (err: any) {
        console.error('Camera init error:', err);

        // More specific error messages
        let errorMessage = 'Gagal mengakses kamera';

        if (err.message === 'HTTPS_REQUIRED') {
          errorMessage = 'Akses kamera memerlukan HTTPS. Pastikan mengakses melalui HTTPS atau gunakan localhost. Jika mengakses via IP, gunakan https:// atau setup SSL certificate.';
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.';
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          errorMessage = 'Kamera tidak mendukung pengaturan yang diminta.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Akses kamera diblokir. Pastikan menggunakan HTTPS atau localhost.';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setCameraReady(false);
      }
    };

    initCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [mode]);

  // Start face detection loop when camera is ready
  useEffect(() => {
    if (cameraReady && mode === 'camera' && !animationFrameId.current) {
      const startDetection = async () => {
        if (!videoRef.current) return;

        const detectLoop = async () => {
          if (!videoRef.current || !cameraReady || mode !== 'camera') {
            return;
          }

          try {
            const result = await detectFaces(videoRef.current);
            if (result.faceDetected && result.boundingBox) {
              const video = videoRef.current;
              const videoWidth = video.videoWidth;
              const videoHeight = video.videoHeight;

              const box = {
                x: result.boundingBox.x * videoWidth,
                y: result.boundingBox.y * videoHeight,
                width: result.boundingBox.width * videoWidth,
                height: result.boundingBox.height * videoHeight
              };
              setFaceBox(box);
            } else {
              setFaceBox(null);
            }
          } catch (err) {
            console.error('Face detection loop error:', err);
          }

          setTimeout(() => {
            if (mode === 'camera' && cameraReady) {
              animationFrameId.current = requestAnimationFrame(detectLoop);
            }
          }, 100);
        };

        detectLoop();
      };

      startDetection();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [cameraReady, mode]);

  // Detect face in uploaded image when loaded
  useEffect(() => {
    if (mode === 'upload' && uploadedImageRef.current && uploadImageLoaded) {
      const detectUploadedFace = async () => {
        const img = uploadedImageRef.current;
        if (!img) return;

        try {
          const result = await detectFaces(img);
          if (result.faceDetected && result.boundingBox) {
            const box = {
              x: result.boundingBox.x * img.naturalWidth,
              y: result.boundingBox.y * img.naturalHeight,
              width: result.boundingBox.width * img.naturalWidth,
              height: result.boundingBox.height * img.naturalHeight
            };
            setFaceBox(box);
          } else {
            setFaceBox(null);
          }
        } catch (err) {
          console.error('Upload face detection error:', err);
          setFaceBox(null);
        }
      };

      detectUploadedFace();
    }
  }, [uploadedImage, uploadImageLoaded, mode]);

  // Draw face overlay on canvas
  useEffect(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the reference element (video or image)
    const refElement = mode === 'camera' ? videoRef.current : uploadedImageRef.current;
    if (!refElement) return;

    // Match canvas size to display size
    const rect = refElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face bounding box
    if (faceBox) {
      const sourceWidth = mode === 'camera'
        ? (refElement as HTMLVideoElement).videoWidth
        : (refElement as HTMLImageElement).naturalWidth;
      const sourceHeight = mode === 'camera'
        ? (refElement as HTMLVideoElement).videoHeight
        : (refElement as HTMLImageElement).naturalHeight;

      if (sourceWidth === 0 || sourceHeight === 0) return;

      const scaleX = rect.width / sourceWidth;
      const scaleY = rect.height / sourceHeight;

      ctx.strokeStyle = '#10B981'; // Green
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 8;

      ctx.strokeRect(
        faceBox.x * scaleX,
        faceBox.y * scaleY,
        faceBox.width * scaleX,
        faceBox.height * scaleY
      );

      // Draw corner accents
      const cornerLength = 20;
      ctx.lineWidth = 4;
      const x = faceBox.x * scaleX;
      const y = faceBox.y * scaleY;
      const w = faceBox.width * scaleX;
      const h = faceBox.height * scaleY;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLength);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLength);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLength, y + h);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLength);
      ctx.stroke();

      // Face detected label
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillRect(x, y - 24, 100, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Wajah Terdeteksi', x + 8, y - 10);
    }
  }, [faceBox, mode, uploadImageLoaded]);

  const handleCapture = async () => {
    if (mode === 'camera' && videoRef.current && cameraReady) {
      const result = await analyzeSkin(videoRef.current);
      saveToDataset(result);
      onCapture(result);
    } else if (mode === 'upload' && uploadedImage && canvasRef.current) {
      // Analyze uploaded image
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // Create a fake video-like object for analyzer
        const result = await analyzeFromCanvas(canvas);
        saveToDataset(result);
        onCapture(result);
      };
      img.src = uploadedImage;
    }
  };

  const analyzeFromCanvas = async (canvas: HTMLCanvasElement): Promise<AnalysisResult> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { skinType: 'Error', scores: { oily: 0, dry: 0, normal: 0, acne: 0 }, faceDetected: false };

    // Use 9:14 aspect ratio for better face detection (consistent with UI)
    const targetAspectRatio = 9 / 14;
    const canvasAspectRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, sx, sy;

    if (canvasAspectRatio > targetAspectRatio) {
      drawHeight = canvas.height;
      drawWidth = canvas.height * targetAspectRatio;
      sx = (canvas.width - drawWidth) / 2;
      sy = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = canvas.width / targetAspectRatio;
      sx = 0;
      sy = (canvas.height - drawHeight) / 2;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 128;
    tempCanvas.height = 128;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(canvas, sx, sy, drawWidth, drawHeight, 0, 0, 128, 128);

    // Use CNN face detection for uploaded images
    const detectionResult = await detectFaces(canvas);
    const faceDetected = detectionResult.faceDetected && detectionResult.confidence > 0.2;

    if (!faceDetected) {
      return { skinType: 'Unknown', scores: { oily: 0, dry: 0, normal: 0, acne: 0 }, faceDetected: false };
    }

    // CNN-based skin classification (replaces heuristic)
    const imageData = tempCtx.getImageData(0, 0, 128, 128);

    try {
      const { classifySkin, probabilitiesToScores, formatLabel } = await import('@/lib/cnnSkinClassifier');
      const prediction = await classifySkin(imageData);
      const scores = probabilitiesToScores(prediction.probabilities);

      return {
        skinType: formatLabel(prediction.label),
        scores,
        faceDetected: true,
        imageData: tempCanvas.toDataURL('image/jpeg', 0.8),
        confidence: Math.round(prediction.confidence * 100),
      };
    } catch (error) {
      console.error('CNN classification error:', error);
      return { skinType: 'Error', scores: { oily: 0, dry: 0, normal: 0, acne: 0 }, faceDetected: false };
    }
  };

  const saveToDataset = async (result: AnalysisResult) => {
    if (result.faceDetected && result.imageData) {
      try {
        await fetch('/api/dataset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: result.imageData, scores: result.scores, skinType: result.skinType }),
        });
      } catch (e) { console.error('Failed to save:', e); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setError('Hanya boleh mengunggah file JPG atau PNG.');
      setUploadedImage(null);
      e.target.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran file melebihi 3MB. Pilih file yang lebih kecil.');
      setUploadedImage(null);
      e.target.value = '';
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setUploadImageLoaded(false);
      setFaceBox(null);
      setError(null);
      setUploadLoading(false);
      e.target.value = '';
    };
    reader.onerror = () => {
      setError('Gagal membaca file. Coba lagi.');
      setUploadedImage(null);
      setUploadLoading(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="flex h-full max-h-[60vh] lg:max-h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-2 sm:p-4 min-h-0 overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('camera'); setUploadedImage(null); }}
            className={`px-3 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg transition touch-manipulation ${mode === 'camera' ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#111]/70'
              }`}
          >
            📷 Kamera
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-3 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg transition touch-manipulation ${mode === 'upload' ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#111]/70'
              }`}
          >
            📁 Upload
          </button>
        </div>
        <span className="text-xs text-[#111]/40 hidden sm:inline">
          {mode === 'camera' ? 'Live Capture' : 'Upload Gambar'}
        </span>
      </div>

      {/* Content Area - Using flex container with 9:14 aspect ratio */}
      <div className="flex-1 flex flex-col relative items-center justify-center min-h-0">
        <div className="relative w-full max-w-full sm:max-w-md mx-auto flex items-center justify-center rounded-lg bg-[#111]">
          <div className="w-full max-w-full sm:max-w-md aspect-[9/14] relative overflow-hidden rounded-lg">
            {mode === 'camera' ? (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Oval face positioning guide - static overlay */}
                {cameraReady && !isAnalyzing && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                    {/* Vignette mask */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <mask id="ovalMask">
                          <rect width="100%" height="100%" fill="white" />
                          <ellipse
                            cx="50%"
                            cy="45%"
                            rx="35%"
                            ry="42%"
                            fill="black"
                          />
                        </mask>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.5)"
                        mask="url(#ovalMask)"
                      />
                    </svg>
                    {/* Oval guide border */}
                    <svg className="absolute inset-0 w-full h-full">
                      <ellipse
                        cx="50%"
                        cy="45%"
                        rx="35%"
                        ry="42%"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeDasharray="8 4"
                        opacity="0.8"
                      />
                    </svg>
                    {/* Instruction text */}
                    <div className="absolute top-[8%] left-0 right-0 flex justify-center">
                      <div className="bg-black/60 px-3 py-1.5 rounded-full">
                        <p className="text-white text-xs font-medium">Posisikan wajah di dalam oval</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Face detection overlay canvas */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 10 }}
                />
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                    Mengaktifkan kamera...
                  </div>
                )}
              </>
            ) : (
              <>
                {uploadedImage ? (
                  <>
                    <img
                      ref={uploadedImageRef}
                      src={uploadedImage}
                      alt="Uploaded"
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                      onLoad={() => setUploadImageLoaded(true)}
                    />
                    {/* Face detection overlay for uploaded image */}
                    {uploadImageLoaded && (
                      <canvas
                        ref={overlayCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 10 }}
                      />
                    )}
                  </>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center text-white/60 cursor-pointer hover:text-white/80 transition"
                  >
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-sm">Klik untuk upload gambar</span>
                    <span className="text-xs mt-2 opacity-80">JPG/PNG, max 3MB</span>
                  </div>
                )}
              </>
            )}

            {uploadLoading && mode === 'upload' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white text-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                <p className="mt-2">Memuat gambar...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-sm text-red-400 p-4 text-center z-30">
                <p className="mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setCameraReady(false);
                    // Retry camera initialization
                    if (mode === 'camera') {
                      const retryInit = async () => {
                        try {
                          const isSecureContext = window.isSecureContext ||
                            location.protocol === 'https:' ||
                            location.hostname === 'localhost' ||
                            location.hostname === '127.0.0.1';

                          if (!isSecureContext) {
                            throw new Error('HTTPS_REQUIRED');
                          }

                          const getUserMedia = getUserMediaWithFallback();
                          if (!getUserMedia) {
                            throw new Error('getUserMedia tidak didukung di browser ini. Pastikan menggunakan browser modern (Chrome, Firefox, Safari)');
                          }

                          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                          const constraints: MediaStreamConstraints = {
                            video: isMobile ? {
                              facingMode: { ideal: 'user' },
                              width: { ideal: 640, max: 1280 },
                              height: { ideal: 480, max: 720 }
                            } : {
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                              facingMode: 'user'
                            },
                            audio: false
                          };

                          const stream = await getUserMedia(constraints);
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.setAttribute('playsinline', 'true');
                            videoRef.current.muted = true;
                            await videoRef.current.play();
                            setCameraReady(true);
                            setError(null);
                          }
                        } catch (err: any) {
                          console.error('Camera retry error:', err);
                          let errorMessage = 'Gagal mengakses kamera';

                          if (err.message === 'HTTPS_REQUIRED') {
                            errorMessage = 'Akses kamera memerlukan HTTPS. Pastikan mengakses melalui HTTPS atau gunakan localhost. Jika mengakses via IP, gunakan https:// atau setup SSL certificate.';
                          } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                            errorMessage = 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
                          } else if (err.name === 'NotFoundError') {
                            errorMessage = 'Kamera tidak ditemukan.';
                          } else if (err.name === 'NotReadableError') {
                            errorMessage = 'Kamera sedang digunakan aplikasi lain.';
                          } else if (err.name === 'SecurityError') {
                            errorMessage = 'Akses kamera diblokir. Pastikan menggunakan HTTPS atau localhost.';
                          } else if (err.message) {
                            errorMessage = err.message;
                          }
                          setError(errorMessage);
                        }
                      };
                      retryInit();
                    }
                  }}
                  className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium touch-manipulation"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                <p className="mt-3 text-sm font-medium text-white">Menganalisis kulit...</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for upload analysis */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload image"
          disabled={uploadLoading || isAnalyzing}
        />

        {/* Capture/Analyze Button - Positioned properly */}
        <button
          disabled={isAnalyzing || uploadLoading || (mode === 'camera' && !cameraReady) || (mode === 'upload' && !uploadedImage)}
          onClick={handleCapture}
          className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-4 border-white bg-[#3B82F6] text-white shadow-lg transition active:bg-[#2563EB] hover:bg-[#2563EB] disabled:opacity-40 absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 touch-manipulation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      </div>
    </section>
  );
}
