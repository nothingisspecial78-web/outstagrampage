import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Smile, Camera, RefreshCw, Square, RotateCcw, Image as ImageIcon } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: { caption: string; location: string; mediaUrl: string; isVideo?: boolean }) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('West Pier, Berlin');
  const [mode, setMode] = useState<'camera' | 'gallery'>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const [selectedImage, setSelectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'
  );
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Video recording states
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const holdTimerRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);
  const holdStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  const sampleImages = [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
  ];

  // Stop camera stream helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start live camera stream
  const startCamera = async () => {
    stopStream();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError('Camera API not available in this browser.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: true,
        });
      } catch {
        // Fallback to video only if audio is denied or unavailable
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasCamera(true);
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      setHasCamera(false);
      setCameraError('Camera access unavailable. Using preview fallback.');
    }
  };

  // Setup camera when modal opens in camera mode or facingMode toggles
  useEffect(() => {
    if (isOpen && mode === 'camera' && !capturedMedia) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isOpen, mode, facingMode, capturedMedia]);

  // Toggle front and back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Snap instant photo
  const snapPhoto = () => {
    if (!videoRef.current) {
      setCapturedMedia({ url: selectedImage, isVideo: false });
      return;
    }

    try {
      const v = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth || 640;
      canvas.height = v.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror horizontal for natural selfie
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedMedia({ url: dataUrl, isVideo: false });
        stopStream();
      }
    } catch {
      setCapturedMedia({ url: selectedImage, isVideo: false });
    }
  };

  // Start video recording
  const startVideoRecording = () => {
    if (!streamRef.current || isRecordingRef.current) return;

    try {
      recordedChunksRef.current = [];
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      }

      const recorder = new MediaRecorder(
        streamRef.current,
        mimeType ? { mimeType } : undefined
      );

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setCapturedMedia({ url: base64, isVideo: true });
          stopStream();
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec >= 30) {
            stopVideoRecording();
            return 30;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting video recorder:', err);
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsHolding(false);
    setHoldProgress(0);
  };

  // Pointer down on capture button: hold 2 seconds to automatically record video
  const handlePointerDown = () => {
    if (isRecordingRef.current) {
      stopVideoRecording();
      return;
    }

    setIsHolding(true);
    setHoldProgress(0);
    holdStartTimeRef.current = Date.now();

    // Visual progress fill over 2000ms
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, (elapsed / 2000) * 100);
      setHoldProgress(pct);
    }, 40);

    // 2-second hold threshold
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      setHoldProgress(100);
      startVideoRecording();
    }, 2000);
  };

  // Pointer up on capture button
  const handlePointerUp = () => {
    const elapsed = Date.now() - holdStartTimeRef.current;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);

    if (isRecordingRef.current) {
      // Releasing after 2s recording stops the video
      stopVideoRecording();
    } else if (elapsed < 2000) {
      // Tapped/released before 2 seconds: take a photo!
      snapPhoto();
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
    if (isRecordingRef.current) {
      stopVideoRecording();
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleShare = () => {
    if (!caption.trim()) return;
    const finalMedia = capturedMedia ? capturedMedia.url : selectedImage;
    const isVideo = capturedMedia ? capturedMedia.isVideo : false;

    onPostCreated({
      caption,
      location,
      mediaUrl: finalMedia,
      isVideo,
    });
    setCaption('');
    setCapturedMedia(null);
    stopStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in select-none">
      <button
        onClick={() => {
          stopStream();
          onClose();
        }}
        className="absolute top-5 right-6 text-white hover:text-slate-300 transition-colors cursor-pointer"
        aria-label="Close modal"
      >
        <X className="size-8" />
      </button>

      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[550px]">
        {/* Left Side: Media Preview / Camera Viewfinder */}
        <div className="w-full md:w-[58%] h-72 md:h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Top Mode Tabs: Live Camera vs Gallery */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
            <button
              onClick={() => {
                setMode('camera');
                setCapturedMedia(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'camera' ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Camera className="size-3.5" /> Camera
            </button>
            <button
              onClick={() => {
                setMode('gallery');
                stopStream();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'gallery' ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ImageIcon className="size-3.5" /> Gallery
            </button>
          </div>

          {/* Camera View or Selected Media */}
          {mode === 'camera' ? (
            capturedMedia ? (
              // Review Captured Media
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {capturedMedia.isVideo ? (
                  <video
                    src={capturedMedia.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={capturedMedia.url}
                    alt="Captured post"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Retake Button */}
                <button
                  onClick={handleRetake}
                  className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                >
                  <RotateCcw className="size-3.5" /> Retake
                </button>
              </div>
            ) : (
              // Live Viewfinder
              <div className="relative w-full h-full flex items-center justify-center">
                {hasCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <Camera className="size-12 mb-2 text-slate-600 animate-pulse" />
                    <p className="text-xs">{cameraError || 'Initializing camera...'}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Front / Rear Flip Camera Button */}
                <button
                  onClick={toggleFacingMode}
                  title="Switch front / rear camera"
                  className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <RefreshCw className="size-3.5 text-orange-400" />
                  <span>{facingMode === 'user' ? 'Front' : 'Rear'}</span>
                </button>

                {/* Recording indicator pill */}
                {isRecording && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg animate-pulse">
                    <span className="size-2 rounded-full bg-white animate-ping" />
                    <span>REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                  </div>
                )}

                {/* Capturing Button & Hint */}
                <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 z-30 pointer-events-auto">
                  <span className="text-[10px] font-medium text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {isRecording
                      ? 'Release or tap to stop recording'
                      : isHolding
                      ? 'Hold for 2s to record video...'
                      : 'Tap for photo · Hold 2s for video'}
                  </span>

                  <div className="relative flex items-center justify-center">
                    {/* SVG progress ring around shutter button */}
                    <svg className="size-20 -rotate-90 pointer-events-none" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="4"
                      />
                      {(isHolding || isRecording) && (
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          fill="none"
                          stroke={isRecording ? '#ef4444' : '#FF6B00'}
                          strokeWidth="4"
                          strokeDasharray={213.6}
                          strokeDashoffset={isRecording ? 0 : 213.6 - (213.6 * holdProgress) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-75"
                        />
                      )}
                    </svg>

                    {/* Shutter button */}
                    <button
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerCancel}
                      onPointerCancel={handlePointerCancel}
                      aria-label="Capture photo or hold 2 seconds for video"
                      className={`absolute grid size-16 place-items-center rounded-full transition-transform active:scale-95 focus:outline-none cursor-pointer ${
                        isRecording
                          ? 'bg-red-600 animate-pulse'
                          : 'bg-white/90 hover:bg-white'
                      }`}
                    >
                      {isRecording ? (
                        <Square className="size-6 text-white fill-current rounded-sm" />
                      ) : (
                        <span className="size-12 rounded-full border-2 border-slate-900/20 bg-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            // Gallery Mode
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />

              {/* Quick photo picker overlay */}
              <div className="absolute bottom-3 inset-x-3 p-2 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {sampleImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImage(img);
                        setCapturedMedia(null);
                      }}
                      className={`size-10 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedImage === img ? 'border-[#FF6B00] scale-105' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const random = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    setSelectedImage(random);
                    setCapturedMedia(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold cursor-pointer"
                >
                  Shuffle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Details & Caption */}
        <div className="w-full md:w-[42%] flex flex-col justify-between p-5 border-l border-slate-100 bg-white">
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900">Create new Outstagram post</h3>
              <button
                onClick={handleShare}
                disabled={!caption.trim()}
                className={`text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  caption.trim() ? 'text-[#FF6B00] hover:text-orange-600' : 'text-slate-300'
                }`}
              >
                Share
              </button>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5">
                <div className="size-full rounded-full bg-white flex items-center justify-center text-[11px] font-bold text-slate-800">
                  AB
                </div>
              </div>
              <span className="font-bold text-xs text-slate-900">abdullanothing7</span>
            </div>

            {/* Caption Textarea */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... (e.g. Sat here until the sun went down. No phones, just real moments.)"
              rows={4}
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 border-none resize-none focus:outline-none"
            />

            {/* Location selector */}
            <div className="flex items-center gap-2 py-2.5 border-t border-slate-100 text-xs text-slate-600">
              <MapPin className="size-4 text-[#FF6B00]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full bg-transparent font-medium text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Character counter & Emoji helper */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCaption((c) => c + ' ☀️✨')}
              className="text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <Smile className="size-4" />
            </button>
            <span className="text-[11px]">{caption.length}/2,200</span>
          </div>
        </div>
      </div>
    </div>
  );
};
