"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getWeather } from "@/lib/api";
import { UI_TRANSLATIONS } from "@/lib/constants";
import { Icons } from "@/components/ui/Icons";
import type { AnalyzeResponse, SeverityTier, WeatherRiskResponse, CropType, Language } from "@/lib/types";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_EXPERT_WHATSAPP_NUMBER || "";

export default function ResultsPage() {
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>("wheat");
  const [district, setDistrict] = useState<string>("");
  const [lang, setLang] = useState<Language>("en");

  const [weatherRisk, setWeatherRisk] = useState<WeatherRiskResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedResult = sessionStorage.getItem("agri_analysis_result");
      if (storedResult) setResult(JSON.parse(storedResult));

      const storedImage = sessionStorage.getItem("agri_analysis_image");
      if (storedImage) setImagePreview(storedImage);

      const storedCrop = sessionStorage.getItem("agri_analysis_crop");
      if (storedCrop) setCropType(storedCrop);

      const storedDistrict = sessionStorage.getItem("agri_analysis_district");
      if (storedDistrict) {
        setDistrict(storedDistrict);
        setIsWeatherLoading(true);
        getWeather(storedDistrict, (storedCrop || "wheat") as CropType)
          .then((data) => setWeatherRisk(data))
          .catch(() => setWeatherRisk(null))
          .finally(() => setIsWeatherLoading(false));
      }

      const storedLang = sessionStorage.getItem("agri_analysis_lang");
      if (storedLang) setLang(storedLang as Language);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const isRtl = lang === "ur" || lang === "sd";

  if (!mounted) {
    return (
      <div style={{ background: "#F0EDE5", minHeight: "100vh" }} className="flex items-center justify-center p-4">
        <div className="card-croplyx p-8 text-center space-y-4 max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  // Empty state if no analysis result
  if (!result) {
    return (
      <div style={{ background: "#F0EDE5", minHeight: "100vh" }} className="flex items-center justify-center p-4">
        <div className="card-croplyx p-8 text-center space-y-4 max-w-md w-full shadow-lg">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "#E8F5EE", color: "#16A34A" }}
          >
            <Icons.Scan className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">{t.noHistory}</h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Please capture or upload an infected crop leaf to view full AI diagnosis and Grad-CAM explainability.
          </p>
          <div className="pt-2">
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm cursor-pointer active:scale-98"
              style={{ background: "#1a3626" }}
            >
              <Icons.Camera className="w-4 h-4" />
              <span>{t.scanFirstCrop}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { diagnosis, severity, explanation, escalate, is_mock } = result;
  const isUncertain = diagnosis.uncertain;
  const confidencePct = (diagnosis.confidence * 100).toFixed(1);

  // Severity color styles
  const severityColors: Record<SeverityTier, { bg: string; text: string; border: string; bar: string; label: string }> = {
    healthy:  { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", bar: "bg-emerald-600", label: "Healthy" },
    low:      { bg: "bg-teal-50",    text: "text-teal-800",    border: "border-teal-200",    bar: "bg-teal-600",    label: "Low Severity" },
    moderate: { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200",   bar: "bg-amber-500",   label: "Moderate Severity" },
    severe:   { bg: "bg-red-50",     text: "text-red-800",     border: "border-red-200",     bar: "bg-red-600",     label: "Severe Infection" },
  };

  const currentSeverityStyle = severityColors[severity.tier] || severityColors.moderate;

  const handleWhatsAppContact = () => {
    if (!WHATSAPP_NUMBER) return;
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum! I scanned a ${cropType} crop leaf. AI result: ${diagnosis.disease} (${confidencePct}% confidence, ${severity.tier} severity). I require expert review.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Top Banner Header — Croplyx deep forest green */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-white">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diagnostic Assessment Report · {cropType.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isUncertain ? "Uncertain Assessment" : diagnosis.disease}
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Automated computer vision diagnosis with OpenCV severity and Grad-CAM explainability.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">
              {confidencePct}%
            </div>
            <span className="text-[11px] text-white/50 uppercase font-bold tracking-wider">
              {t.confidence} Score
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 pb-16 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* ── Top Banner: DEMO MODE Alert (if is_mock) ───────────────────────── */}
        {is_mock && (
          <div
            role="alert"
            className="p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fade-in-up"
            style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E" }}
          >
            <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
              DEMO MODE
            </span>
            <p className="leading-relaxed">
              This result was generated using deterministic demo inference for demonstration purposes.
            </p>
          </div>
        )}

        {/* ── SECTION 1: AI DIAGNOSIS ────────────────────────────────────────── */}
        <div className="card-croplyx p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "#E5E1D8" }}>
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#16A34A" }}>
                {t.diagnosisTitle} · {cropType.toUpperCase()}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {isUncertain ? "Uncertain Assessment" : diagnosis.disease}
              </h2>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                  isUncertain ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isUncertain ? "Needs Agronomist Review" : "High Confidence"}
              </span>
            </div>
          </div>

          {/* Low-Confidence / Uncertainty Warning */}
          {isUncertain && (
            <div
              role="alert"
              className="p-4 rounded-2xl space-y-1 shadow-sm"
              style={{ background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E" }}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Icons.AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{t.lowConfidenceWarning}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                Symptoms indicate possible <strong>{diagnosis.disease}</strong> with {confidencePct}% confidence. Consult a qualified agronomist before applying chemical interventions.
              </p>
            </div>
          )}

          {/* Top-3 Model Probabilities */}
          {diagnosis.top_predictions && diagnosis.top_predictions.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Model Confidence Distribution
              </div>
              <div className="space-y-2">
                {diagnosis.top_predictions.slice(0, 3).map((pred, idx) => {
                  const pct = (pred.confidence * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 font-semibold">{pred.disease}</span>
                        <span className="font-black text-gray-900">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E5E1D8" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(Number(pct), 2)}%`,
                            background: idx === 0 ? "#16A34A" : "#9CA3AF",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: DISEASE SEVERITY ────────────────────────────────────── */}
        <div className="card-croplyx p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "#E5E1D8" }}>
            <div className="flex items-center gap-2">
              <Icons.Activity className="w-5 h-5" style={{ color: "#16A34A" }} />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{t.severity}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black capitalize border ${currentSeverityStyle.bg} ${currentSeverityStyle.text} ${currentSeverityStyle.border}`}>
              {currentSeverityStyle.label}
            </span>
          </div>

          {/* Severity Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 font-semibold">
              <span>{t.affectedArea}</span>
              <span className="text-base font-extrabold text-gray-900">{severity.affected_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden p-0.5" style={{ background: "#E5E1D8" }}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${currentSeverityStyle.bar}`}
                style={{ width: `${Math.max(severity.affected_percentage, 3)}%` }}
                role="progressbar"
                aria-valuenow={severity.affected_percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Affected area ${severity.affected_percentage}%`}
              />
            </div>
          </div>

          {/* Mandatory OpenCV Disclaimer */}
          <p className="text-[11px] text-gray-400 italic leading-relaxed pt-1">
            {t.opencvDisclaimer}
          </p>
        </div>

        {/* ── SECTION 3: WHY THE MODEL THINKS THIS (GRAD-CAM) ────────────────── */}
        <div className="card-croplyx p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "#E5E1D8" }}>
            <Icons.Sparkles className="w-5 h-5" style={{ color: "#E9A800" }} />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">{t.whyModelThinksThis}</h2>
              <p className="text-xs text-gray-500">{t.gradcamExplanation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Uploaded Original Leaf */}
            {imagePreview && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <Icons.Camera className="w-3.5 h-3.5 text-gray-400" />
                  <span>Original Uploaded Leaf</span>
                </div>
                <div className="relative h-56 w-full rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "#E5E1D8", background: "#FAF8F5" }}>
                  <Image
                    src={imagePreview}
                    alt="Original scanned leaf photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Grad-CAM Heatmap Overlay */}
            {explanation.gradcam_image ? (
              <div className="space-y-1.5">
                <div className="text-xs font-bold flex items-center gap-1" style={{ color: "#16A34A" }}>
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                  <span>Neural Attention Heatmap (Grad-CAM)</span>
                </div>
                <div className="relative h-56 w-full rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "#BBF7D0", background: "#FAF8F5" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={explanation.gradcam_image}
                    alt="Grad-CAM visual explanation overlay"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="h-56 rounded-2xl border flex items-center justify-center p-4 text-center text-xs text-gray-400" style={{ borderColor: "#E5E1D8", background: "#FAF8F5" }}>
                Visual Grad-CAM explanation is not available in mock demo mode.
              </div>
            )}
          </div>

          <div
            className="p-3.5 rounded-xl text-xs leading-relaxed"
            style={{ background: "#FAF8F5", border: "1px solid #E5E1D8", color: "#374151" }}
          >
            {explanation.key_regions || t.gradcamExplanation}
          </div>
        </div>

        {/* ── SECTION 4: DISTRICT RISK CONTEXT ───────────────────────────────── */}
        {district && (
          <div className="card-croplyx p-6 sm:p-7 space-y-3">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "#E5E1D8" }}>
              <div className="flex items-center gap-2">
                <Icons.Map className="w-5 h-5" style={{ color: "#16A34A" }} />
                <div>
                  <h2 className="text-base font-bold text-gray-900">District Outbreak Context</h2>
                  <span className="text-xs text-gray-500">{district} · {cropType.toUpperCase()}</span>
                </div>
              </div>

              {weatherRisk && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase"
                  style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}
                >
                  {weatherRisk.overall_risk_label} RISK
                </span>
              )}
            </div>

            {isWeatherLoading ? (
              <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                Loading district meteorological risk telemetry...
              </div>
            ) : weatherRisk ? (
              <div className="p-4 rounded-2xl space-y-2 text-xs" style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}>
                <div className="flex justify-between items-center text-gray-700">
                  <span>7-Day Disease Risk Index:</span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    {(weatherRisk.overall_risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                {weatherRisk.primary_driver && (
                  <div className="text-[11px] font-medium" style={{ color: "#15803d" }}>
                    Primary Driver: <span className="text-gray-600">{weatherRisk.primary_driver}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                No real-time risk data available for {district}.
              </p>
            )}
          </div>
        )}

        {/* ── SECTION 5: WHAT TO DO NEXT (EXPERT & ADVISOR CTAS) ─────────────── */}
        {(escalate || isUncertain) && (
          <div
            role="region"
            aria-label="Expert Review"
            className="card-croplyx p-6 space-y-4 animate-fade-in-up"
            style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#F59E0B", color: "#ffffff" }}
              >
                <Icons.PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">{t.expertRecommended}</h2>
                <p className="text-xs text-amber-900/80 leading-relaxed mt-0.5">
                  Because AI confidence is low, field validation by a human agronomist is strongly recommended prior to treatment.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {WHATSAPP_NUMBER && (
                <button
                  onClick={handleWhatsAppContact}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                  style={{ background: "#15803d" }}
                >
                  <Icons.Message className="w-4 h-4" />
                  <span>{t.contactWhatsApp}</span>
                </button>
              )}
              <Link
                href="/expert"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: "#ffffff", border: "1px solid #D97706", color: "#92400E" }}
              >
                <Icons.PhoneCall className="w-4 h-4" />
                <span>Expert Escalation Portal</span>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/advisor?from=results"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
            style={{ background: "#1a3626" }}
          >
            <Icons.Message className="w-4 h-4" />
            <span>{t.askAdvisor}</span>
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
          >
            <Icons.Dashboard className="w-4 h-4" style={{ color: "#16A34A" }} />
            <span>{t.dashboard}</span>
          </Link>
          <Link
            href="/diagnose"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            style={{ background: "#ffffff", border: "1px solid #E5E1D8", color: "#374151" }}
          >
            <Icons.Camera className="w-4 h-4" />
            <span>{t.scanAnother}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
