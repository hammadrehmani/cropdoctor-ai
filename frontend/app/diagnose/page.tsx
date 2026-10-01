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
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
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
      <div className="card-croplyx p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-800">
            1. Crop Leaf Photo <span style={{ color: "#16A34A" }}>*</span>
          </label>
          <span className="text-xs text-gray-400 font-medium">JPEG, PNG, WebP (Max 10MB)</span>
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
          <div
            className="border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all space-y-4"
            style={{ borderColor: "#D1CEC8", background: "#FAF8F4" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#E8F5EE", color: "#16A34A" }}
            >
              <Icons.Leaf className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-800">
                {t.photoInstruction}
              </p>
              <p className="text-xs text-gray-500">
                Ensure good lighting and capture the infected leaf area clearly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleOpenCamera}
                disabled={isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "#1a3626", color: "#fff" }}
              >
                <Icons.Camera className="w-4 h-4" />
                <span>{t.takePhoto}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={isAnalyzing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "#F0EDE5", color: "#374151", border: "1px solid #D1CEC8" }}
              >
                <Icons.Scan className="w-4 h-4" style={{ color: "#16A34A" }} />
                <span>{t.uploadGallery}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ border: "1px solid #E5E1D8" }}>
            <div className="relative h-64 sm:h-80 w-full" style={{ background: "#F4F1E8" }}>
              <Image
                src={previewUrl}
                alt="Selected leaf preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="flex items-center justify-between p-3.5" style={{ background: "#F8F6F0", borderTop: "1px solid #E5E1D8" }}>
              <div className="flex items-center gap-2 text-xs font-bold truncate max-w-[200px] sm:max-w-xs" style={{ color: "#16A34A" }}>
                <span>✓ Photo ready</span>
                {selectedFile && (
                  <span className="text-gray-400 font-normal">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  disabled={isAnalyzing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  style={{ background: "#F0EDE5", color: "#374151", border: "1px solid #D1CEC8" }}
                >
                  {t.changePhoto}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isAnalyzing}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                >
                  {t.removePhoto}
                </button>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div role="alert" className="p-3.5 rounded-xl text-xs flex items-start gap-2 animate-fade-in-up" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
            <Icons.AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
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
      <div className="card-croplyx p-5 sm:p-6 space-y-3">
        <label className="block text-sm font-bold text-gray-800">
          2. {t.selectCrop} <span style={{ color: "#16A34A" }}>*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CROPS.map((crop) => (
            <button
              type="button"
              key={crop.value}
              onClick={() => setSelectedCrop(crop.value)}
              disabled={isAnalyzing}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isAnalyzing ? "opacity-60 cursor-not-allowed" : ""
              }`}
              style={{
                background: selectedCrop === crop.value ? "#1a3626" : "#F4F1E8",
                border: selectedCrop === crop.value ? "2px solid #4a9a6b" : "1px solid #E5E1D8",
                color: selectedCrop === crop.value ? "#fff" : "#374151",
              }}
            >
              <div className="flex items-center justify-between">
                <Icons.Leaf className="w-6 h-6" style={{ color: selectedCrop === crop.value ? "#86efac" : "#16A34A" }} />
                {selectedCrop === crop.value && (
                  <span className="text-xs font-extrabold" style={{ color: "#86efac" }}>✓</span>
                )}
              </div>
              <div className="mt-2.5">
                <div className="text-sm font-bold">{crop.label}</div>
                <div className="text-xs font-serif opacity-60" dir="rtl">
                  {selectedLanguage === "sd" ? crop.labelSd : crop.labelUr}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Language & Optional District Selection */}
      <div className="card-croplyx p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language-select" className="block text-xs font-bold text-gray-600 mb-1.5">
              3. {t.responseLang}
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              disabled={isAnalyzing}
              className="w-full text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none disabled:opacity-50"
              style={{ background: "#F4F1E8", border: "1px solid #D1CEC8", color: "#374151" }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label} ({lang.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district-select" className="block text-xs font-bold text-gray-600 mb-1.5">
              4. {t.selectDistrict}
            </label>
            <select
              id="district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isAnalyzing}
              className="w-full text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none disabled:opacity-50"
              style={{ background: "#F4F1E8", border: "1px solid #D1CEC8", color: "#374151" }}
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
        <div role="alert" className="p-4 rounded-xl text-sm space-y-2 animate-fade-in-up" style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }}>
          <div className="flex items-center gap-2 font-bold">
            <Icons.AlertTriangle className="w-4 h-4" />
            <span>AI Service Unavailable</span>
          </div>
          <p className="text-xs leading-relaxed opacity-80">{apiError}</p>
        </div>
      )}

      {apiError && !is503Error && (
        <div role="alert" className="p-4 rounded-xl text-sm space-y-1 animate-fade-in-up flex items-center justify-between gap-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Icons.AlertTriangle className="w-4 h-4" />
              <span>Analysis Error</span>
            </div>
            <p className="text-xs opacity-80">{apiError}</p>
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
            style={{ background: "#DC2626" }}
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
          className={`w-full py-4 px-6 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
            selectedFile ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          }`}
          style={{
            background: selectedFile ? "#1a3626" : "#E5E1D8",
            color: selectedFile ? "#fff" : "#9CA3AF",
          }}
        >
          <Icons.Scan className="w-5 h-5" />
          <span>{t.scanCrop}</span>
        </button>
      ) : (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="card-croplyx p-6 sm:p-8 text-center space-y-4 animate-fade-in-up"
        >
          <div className="inline-block animate-spin" style={{ color: "#16A34A" }}>
            <Icons.RefreshCw className="w-8 h-8" />
          </div>
          <div className="text-base font-bold" style={{ color: "#1a3626" }}>
            {currentStages[loadingStageIndex]}
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden max-w-md mx-auto" style={{ background: "#E8E4DA" }}>
            <div className="h-full animate-pulse rounded-full transition-all duration-500" style={{ width: "75%", background: "linear-gradient(90deg, #16A34A, #E9A800)" }} />
          </div>
          <p className="text-xs text-gray-500">{t.keepBrowserOpen}</p>
        </div>
      )}
    </form>
  );
}

export default function DiagnosePage() {
  return (
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Page Header — Croplyx style cream with dark heading */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <span className="section-label-dark">
            <Icons.Scan className="w-3.5 h-3.5" />
            AI Crop Scanner · Cotton · Wheat · Rice · Sugarcane
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Get Your Disease Risk Report
          </h1>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Upload a crop leaf photo to get automated diagnosis, OpenCV severity measurement, and Grad-CAM explanation.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <Icons.ShieldCheck className="w-4 h-4 text-green-400" />
              Disease risk assessment
            </div>
            <div className="flex items-center gap-2">
              <Icons.Activity className="w-4 h-4 text-green-400" />
              Quick analysis results
            </div>
            <div className="flex items-center gap-2">
              <Icons.Sparkles className="w-4 h-4 text-green-400" />
              Grad-CAM explanation
            </div>
          </div>
        </div>
      </div>

      {/* Form Card — Elevated white card on cream */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 -mt-8 pb-16">
        <div className="card-croplyx p-6 sm:p-8 space-y-6">
          <Suspense
            fallback={
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin text-green-600 flex justify-center mb-3">
                  <Icons.RefreshCw className="w-8 h-8" />
                </div>
                Loading scanner...
              </div>
            }
          >
            <DiagnoseForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
