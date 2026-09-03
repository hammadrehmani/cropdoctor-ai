"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { analyzeCrop, ApiError } from "@/lib/api";
import { CROPS, LANGUAGES, DEMO_DISTRICTS, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_MB, UI_TRANSLATIONS } from "@/lib/constants";
import { Icons } from "@/components/ui/Icons";
import { CameraModal } from "@/components/ui/CameraModal";
import type { CropType, Language } from "@/lib/types";

const LOADING_STAGES: Record<Language, string[]> = {
  en: [
    "Analyzing leaf symptoms...",
    "Running vision neural network...",
    "Estimating affected area percentage...",
    "Preparing Grad-CAM explanation...",
  ],
  ur: [
    "پتے کی علامات کا جائزہ لیا جا رہا ہے...",
    "ویژن نیورل نیٹ ورک فعال ہے...",
    "متاثرہ رقبے کی شدت کا تخمینہ لگایا جا رہا ہے...",
    "تشخیصی ثبوت تیار کیا جا رہا ہے...",
  ],
  sd: [
    "پن جي علامتن جو جائزو ورتو پيو وڃي...",
    "ويزن نيورل نيٽ ورڪ ڪم ڪري رهيو آهي...",
    "متاثر حصي جو اندازو لڳايو پيو وڃي...",
    "تشخيصي ثبوت تيار ٿي رهيو آهي...",
  ],
};

function DiagnoseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill crop and district from query params if available
  const initialCrop = (searchParams.get("crop") as CropType) || "wheat";
  const initialDistrict = searchParams.get("district") || "";

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropType>(initialCrop);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);

  // Validation & Error State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [is503Error, setIs503Error] = useState<boolean>(false);

  // Loading State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState<number>(0);

  // Live Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = UI_TRANSLATIONS[selectedLanguage] || UI_TRANSLATIONS.en;
  const isRtl = selectedLanguage === "ur" || selectedLanguage === "sd";

  // Progressive loading animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        const stages = LOADING_STAGES[selectedLanguage] || LOADING_STAGES.en;
        setLoadingStageIndex((prev) => (prev + 1) % stages.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, selectedLanguage]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validate File Input
  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    setApiError(null);
    setIs503Error(false);

    if (!file || file.size === 0) {
      setValidationError("Selected file is empty. Please choose a valid photo.");
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setValidationError(
        "Unsupported image type. Please upload a JPEG, PNG, or WebP photo."
      );
      return;
    }

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(
        `Image is too large (${sizeMB} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Save Data URL to sessionStorage for /results preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        try {
          sessionStorage.setItem("agri_analysis_image", reader.result);
        } catch {
          // Ignore storage quota limits
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleOpenCamera = () => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      setIsCameraOpen(true);
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setApiError(null);
    setIs503Error(false);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    try {
      sessionStorage.removeItem("agri_analysis_image");
    } catch {}
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isAnalyzing) {
      if (!selectedFile) {
        setValidationError("Please select or capture a crop leaf image first.");
      }
      return;
    }

    setIsAnalyzing(true);
    setApiError(null);
    setIs503Error(false);
    setLoadingStageIndex(0);

    try {
      const result = await analyzeCrop(
        selectedFile,
        selectedCrop,
        selectedDistrict || undefined,
        selectedLanguage
      );

      // Save result in sessionStorage for the /results page
      try {
        sessionStorage.setItem("agri_analysis_result", JSON.stringify(result));
        sessionStorage.setItem("agri_analysis_crop", selectedCrop);
        sessionStorage.setItem("agri_analysis_lang", selectedLanguage);
        sessionStorage.setItem("agri_analysis_district", selectedDistrict);
      } catch (storageErr) {
        console.warn("Could not save full result in sessionStorage:", storageErr);
      }

      router.push("/results");
    } catch (err: unknown) {
      setIsAnalyzing(false);

      if (err instanceof ApiError) {
        if (err.status === 400) {
          setApiError("Image is corrupt or unreadable. Please choose another photo.");
        } else if (err.status === 413) {
          setApiError("Image is too large. Maximum size is 10 MB.");
        } else if (err.status === 415) {
          setApiError("Unsupported image type. Please use JPEG, PNG, or WebP.");
        } else if (err.status === 422) {
          setApiError("Some information is invalid. Please check your selections.");
        } else if (err.status === 503) {
          setIs503Error(true);
          setApiError("AI diagnosis service is currently unconfigured or offline.");
        } else {
          setApiError(err.detail || "Failed to analyze crop. Please try again.");
        }
      } else {
        setApiError("Unable to connect to the diagnosis service. Please check your network.");
      }
    }
  };

  const currentStages = LOADING_STAGES[selectedLanguage] || LOADING_STAGES.en;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Image Upload & Camera Card */}
      <div className="glass p-5 sm:p-6 rounded-3xl border-gray-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-200">
            1. Crop Leaf Photo <span className="text-emerald-400">*</span>
          </label>
          <span className="text-xs text-gray-500 font-medium">JPEG, PNG, WebP (Max 10MB)</span>
        </div>

        {/* Hidden File Input for Gallery */}
        <input
          type="file"
          ref={galleryInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          id="gallery-image-input"
          aria-label="Upload crop leaf photo from gallery"
          disabled={isAnalyzing}
        />

        {/* Hidden File Input for Fallback Native Camera */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
          id="camera-native-input"
          aria-label="Capture crop leaf photo via camera"
          disabled={isAnalyzing}
        />

        {!previewUrl ? (
          <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/80 bg-gray-900/60 rounded-2xl p-6 sm:p-8 text-center transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto">
              <Icons.Leaf className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-200">
                {t.photoInstruction}
              </p>
              <p className="text-xs text-gray-400">
                Ensure good lighting and capture the infected leaf area clearly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              {/* Take Photo / Live Camera Button */}
              <button
                type="button"
                onClick={handleOpenCamera}
                disabled={isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Icons.Camera className="w-4 h-4" />
                <span>{t.takePhoto}</span>
              </button>

              {/* Upload Gallery Button */}
              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs sm:text-sm font-semibold px-5 py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Icons.Scan className="w-4 h-4 text-emerald-400" />
                <span>{t.uploadGallery}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-gray-700 bg-gray-900 shadow-md">
            <div className="relative h-64 sm:h-80 w-full bg-black/50">
              <Image
                src={previewUrl}
                alt="Selected leaf preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-950/95 border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold truncate max-w-[200px] sm:max-w-xs">
                <span>✓ Photo ready</span>
                {selectedFile && (
                  <span className="text-gray-500 font-normal">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  disabled={isAnalyzing}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-3 py-1.5 rounded-xl border border-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.changePhoto}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isAnalyzing}
                  className="text-xs bg-red-950/80 hover:bg-red-900 text-red-300 font-semibold px-3 py-1.5 rounded-xl border border-red-800/60 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.removePhoto}
                </button>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-start gap-2 animate-fade-in-up">
            <Icons.AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Live In-Browser Camera Scanner Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={validateAndSetFile}
        language={selectedLanguage}
      />

      {/* 2. Crop Type Selection */}
      <div className="glass p-5 sm:p-6 rounded-3xl border-gray-800 space-y-3 shadow-lg">
        <label className="block text-sm font-bold text-gray-200">
          2. {t.selectCrop} <span className="text-emerald-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CROPS.map((crop) => (
            <button
              type="button"
              key={crop.value}
              onClick={() => setSelectedCrop(crop.value)}
              disabled={isAnalyzing}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                selectedCrop === crop.value
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-md"
                  : "bg-gray-900/70 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200 hover:bg-gray-900"
              } ${isAnalyzing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icons.Leaf className="w-6 h-6 text-emerald-400" />
                {selectedCrop === crop.value && (
                  <span className="text-xs text-emerald-400 font-extrabold">✓</span>
                )}
              </div>
              <div className="mt-2.5">
                <div className="text-sm font-bold text-gray-100">{crop.label}</div>
                <div className="text-xs text-gray-500 font-serif" dir="rtl">
                  {selectedLanguage === "sd" ? crop.labelSd : crop.labelUr}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Language & Optional District Selection */}
      <div className="glass p-5 sm:p-6 rounded-3xl border-gray-800 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language-select" className="block text-xs font-bold text-gray-300 mb-1.5">
              3. {t.responseLang}
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              disabled={isAnalyzing}
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label} ({lang.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district-select" className="block text-xs font-bold text-gray-300 mb-1.5">
              4. {t.selectDistrict}
            </label>
            <select
              id="district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isAnalyzing}
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none disabled:opacity-50"
            >
              <option value="">-- Select District (Optional) --</option>
              {DEMO_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Callouts */}
      {is503Error && (
        <div role="alert" className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-sm space-y-2 animate-fade-in-up">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Icons.AlertTriangle className="w-4 h-4" />
            <span>AI Service Unavailable</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-200/90">{apiError}</p>
        </div>
      )}

      {apiError && !is503Error && (
        <div role="alert" className="p-4 rounded-2xl bg-red-950/80 border border-red-700 text-red-200 text-sm space-y-1 animate-fade-in-up flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-red-300 text-xs">
              <Icons.AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Analysis Error</span>
            </div>
            <p className="text-xs text-red-200/90">{apiError}</p>
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 4. Submit Action / Progressive Loading */}
      {!isAnalyzing ? (
        <button
          type="submit"
          disabled={!selectedFile}
          className={`w-full py-4 px-6 rounded-2xl text-base font-bold transition-all shadow-xl flex items-center justify-center gap-2 ${
            selectedFile
              ? "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-950/60 cursor-pointer hover:-translate-y-0.5"
              : "bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed"
          }`}
        >
          <Icons.Scan className="w-5 h-5" />
          <span>{t.scanCrop}</span>
        </button>
      ) : (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="glass p-6 sm:p-8 rounded-3xl border-emerald-700/60 text-center space-y-4 animate-fade-in-up shadow-xl"
        >
          <div className="inline-block animate-spin text-emerald-400">
            <Icons.RefreshCw className="w-8 h-8" />
          </div>
          <div className="text-base font-bold text-emerald-300">
            {currentStages[loadingStageIndex]}
          </div>
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden border border-gray-700 p-0.5 max-w-md mx-auto">
            <div className="bg-emerald-500 h-full animate-pulse w-3/4 rounded-full transition-all duration-500" />
          </div>
          <p className="text-xs text-gray-400">{t.keepBrowserOpen}</p>
        </div>
      )}
    </form>
  );
}

export default function DiagnosePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6">
      <div className="text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-xs text-emerald-400 font-bold mb-1">
          <Icons.Scan className="w-3.5 h-3.5" />
          <span>AI Crop Scanner · Cotton · Wheat · Rice · Sugarcane</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">
          Crop Disease Scanner
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Capture or upload an infected crop leaf to obtain automated diagnosis, OpenCV severity measurement, and Grad-CAM explanation.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="glass p-8 text-center text-gray-400 rounded-3xl">
            <div className="animate-spin text-emerald-400 flex justify-center mb-2">
              <Icons.RefreshCw className="w-8 h-8" />
            </div>
            Loading scanner...
          </div>
        }
      >
        <DiagnoseForm />
      </Suspense>
    </div>
  );
}
