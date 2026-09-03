"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icons } from "./Icons";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  language?: "en" | "ur" | "sd";
}

const TEXTS = {
  en: {
    title: "Live Leaf Camera",
    instruction: "Align the diseased leaf inside the target guide",
    capture: "Capture Photo",
    switchCamera: "Switch Camera",
    close: "Close",
    permissionDenied: "Camera access was denied or is not available. Please allow camera permissions or upload from gallery.",
    startingCamera: "Starting camera...",
    tryAgain: "Try Again",
    useFilePicker: "Use Standard Camera / File Picker",
  },
  ur: {
    title: "لائیو کیمرہ اسکینر",
    instruction: "متاثرہ پتے کو فریم کے درمیان میں لائیں",
    capture: "تصویر بنائیں",
    switchCamera: "کیمرہ تبدیل کریں",
    close: "بند کریں",
    permissionDenied: "کیمرہ کی اجازت دستیاب نہیں ہے۔ براہ کرم اجازت دیں یا گیلری سے اپلوڈ کریں۔",
    startingCamera: "کیمرہ شروع کیا جا رہا ہے...",
    tryAgain: "دوبارہ کوشش کریں",
    useFilePicker: "اسٹینڈرڈ کیمرہ فائل سلیکٹر استعمال کریں",
  },
  sd: {
    title: "لائيو ڪيمرا اسڪينر",
    instruction: "بيمار پن کي فريم جي وچ ۾ آڻيو",
    capture: "فوٽو ڪڍو",
    switchCamera: "ڪيمرا تبديل ڪريو",
    close: "بند ڪريو",
    permissionDenied: "ڪيمرا جي اجازت ناهي ملي. مهرباني ڪري اجازت ڏيو يا گيلري مان چونڊيو.",
    startingCamera: "ڪيمرا شروع ٿي رهي آهي...",
    tryAgain: "ٻيهر ڪوشش ڪريو",
    useFilePicker: "معياري ڪيمرا فائل چونڊيو",
  },
};

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  language = "en",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  const t = TEXTS[language] || TEXTS.en;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsLoading(false);
        };
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setIsLoading(false);
      setError(t.permissionDenied);
    }
  }, [facingMode, stopStream, t.permissionDenied]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw full video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `leaf_camera_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-lg bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 bg-gray-900/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-gray-100">{t.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-950/90 text-gray-300 text-sm">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p>{t.startingCamera}</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
                <Icons.AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-red-200 leading-relaxed">{error}</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {t.tryAgain}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Leaf Scanner Target Guides */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-emerald-400/40 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  {/* Corner Target Accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                  {/* Center Target Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-emerald-400/30 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>

                <p className="mt-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-emerald-300 border border-emerald-500/20 text-center">
                  {t.instruction}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        {!error && (
          <div className="p-4 bg-gray-900/90 border-t border-gray-800/80 flex items-center justify-between gap-3">
            {/* Switch Camera Button */}
            {hasMultipleCameras ? (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                disabled={isLoading}
                className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title={t.switchCamera}
                aria-label={t.switchCamera}
              >
                <Icons.RefreshCw className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-11" />
            )}

            {/* Shutter / Capture Button */}
            <button
              type="button"
              onClick={handleCapture}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              </div>
              <span className="text-sm">{t.capture}</span>
            </button>

            {/* Cancel / Close */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
