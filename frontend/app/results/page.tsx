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
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="glass p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  // Empty state if no analysis result
  if (!result) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="glass p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto">
            <Icons.Scan className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-100">{t.noHistory}</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Please capture or upload an infected crop leaf to view full AI diagnosis and Grad-CAM explainability.
          </p>
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-md mt-2 cursor-pointer"
          >
            <Icons.Camera className="w-4 h-4" />
            <span>{t.scanFirstCrop}</span>
          </Link>
        </div>
      </div>
    );
  }

  const { diagnosis, severity, explanation, escalate, is_mock } = result;
  const isUncertain = diagnosis.uncertain;
  const confidencePct = (diagnosis.confidence * 100).toFixed(1);

  // Severity color styles
  const severityColors: Record<SeverityTier, { bg: string; text: string; border: string; bar: string; label: string }> = {
    healthy:  { bg: "bg-emerald-950/80", text: "text-emerald-300", border: "border-emerald-700/60", bar: "bg-emerald-500", label: "Healthy" },
    low:      { bg: "bg-teal-950/80",    text: "text-teal-300",    border: "border-teal-700/60",    bar: "bg-teal-500",    label: "Low Severity" },
    moderate: { bg: "bg-amber-950/80",   text: "text-amber-300",   border: "border-amber-700/60",   bar: "bg-amber-500",   label: "Moderate Severity" },
    severe:   { bg: "bg-red-950/80",     text: "text-red-300",     border: "border-red-700/60",     bar: "bg-red-500",     label: "Severe Infection" },
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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10 space-y-6 animate-fade-in-up" dir={isRtl ? "rtl" : "ltr"}>
      {/* ── Top Banner: DEMO MODE Alert (if is_mock) ───────────────────────── */}
      {is_mock && (
        <div role="alert" className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-md">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold uppercase text-[10px] tracking-wider shrink-0 mt-0.5">
            DEMO MODE
          </span>
          <p className="leading-relaxed">
            This result was generated using deterministic demo inference for demonstration purposes.
          </p>
        </div>
      )}

      {/* ── SECTION 1: AI DIAGNOSIS ────────────────────────────────────────── */}
      <div className="glass p-6 rounded-3xl border-gray-800 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t.diagnosisTitle} · {cropType.toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-100 tracking-tight">
              {isUncertain ? "Uncertain Assessment" : diagnosis.disease}
            </h1>
          </div>
          <div className="text-right">
            <div className={`text-2xl sm:text-3xl font-black ${isUncertain ? "text-amber-400" : "text-emerald-400"}`}>
              {confidencePct}%
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t.confidence}</div>
          </div>
        </div>

        {/* Low-Confidence / Uncertainty Warning */}
        {isUncertain && (
          <div role="alert" className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500/80 text-amber-200 space-y-1 shadow-md">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Icons.AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{t.lowConfidenceWarning}</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Symptoms indicate possible <strong>{diagnosis.disease}</strong> with {confidencePct}% confidence. Consult a qualified agronomist before applying chemical interventions.
            </p>
          </div>
        )}

        {/* Top-3 Model Probabilities */}
        {diagnosis.top_predictions && diagnosis.top_predictions.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Confidence Distribution
            </div>
            <div className="space-y-1.5">
              {diagnosis.top_predictions.slice(0, 3).map((pred, idx) => {
                const pct = (pred.confidence * 100).toFixed(1);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-medium">{pred.disease}</span>
                      <span className="font-bold text-gray-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(Number(pct), 2)}%` }}
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
      <div className="glass p-6 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-gray-100">{t.severity}</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black capitalize border ${currentSeverityStyle.bg} ${currentSeverityStyle.text} ${currentSeverityStyle.border}`}>
            {currentSeverityStyle.label}
          </span>
        </div>

        {/* Severity Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-300 font-semibold">
            <span>{t.affectedArea}</span>
            <span className="text-base font-extrabold text-emerald-400">{severity.affected_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-900 h-3.5 rounded-full overflow-hidden border border-gray-800 p-0.5">
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
        <p className="text-[11px] text-gray-500 italic leading-relaxed pt-1">
          {t.opencvDisclaimer}
        </p>
      </div>

      {/* ── SECTION 3: WHY THE MODEL THINKS THIS (GRAD-CAM) ────────────────── */}
      <div className="glass p-6 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Icons.Sparkles className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-100">{t.whyModelThinksThis}</h2>
            <p className="text-xs text-gray-400">{t.gradcamExplanation}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Uploaded Original Leaf */}
          {imagePreview && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                <Icons.Camera className="w-3.5 h-3.5 text-gray-400" />
                <span>Original Uploaded Leaf</span>
              </div>
              <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
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
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Neural Attention Heatmap (Grad-CAM)</span>
              </div>
              <div className="relative h-52 w-full rounded-2xl overflow-hidden border border-emerald-800/80 bg-gray-950 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={explanation.gradcam_image}
                  alt="Grad-CAM visual explanation overlay"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="h-52 rounded-2xl border border-gray-800 bg-gray-900/60 flex items-center justify-center p-4 text-center text-xs text-gray-400">
              Visual Grad-CAM explanation is not available in mock demo mode.
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-gray-300 leading-relaxed">
          {explanation.key_regions || t.gradcamExplanation}
        </div>
      </div>

      {/* ── SECTION 4: DISTRICT RISK CONTEXT ───────────────────────────────── */}
      {district && (
        <div className="glass p-6 rounded-3xl border-gray-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Map className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-gray-100">District Outbreak Context</h2>
                <span className="text-xs text-gray-400">{district} · {cropType.toUpperCase()}</span>
              </div>
            </div>

            {weatherRisk && (
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-950/80 border border-emerald-800 text-emerald-300 uppercase">
                {weatherRisk.overall_risk_label} RISK
              </span>
            )}
          </div>

          {isWeatherLoading ? (
            <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
              Loading district meteorological risk telemetry...
            </div>
          ) : weatherRisk ? (
            <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-300">
                <span>7-Day Disease Risk Index:</span>
                <span className="font-extrabold text-gray-100 text-sm">
                  {(weatherRisk.overall_risk_score * 100).toFixed(0)}%
                </span>
              </div>
              {weatherRisk.primary_driver && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  Primary Driver: <span className="text-gray-300">{weatherRisk.primary_driver}</span>
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
        <div role="region" aria-label="Expert Review" className="glass p-6 rounded-3xl border-amber-600/70 bg-amber-950/30 space-y-4 shadow-xl animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/80 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
              <Icons.PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">{t.expertRecommended}</h2>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-0.5">
                Because AI confidence is low, field validation by a human agronomist is strongly recommended prior to treatment.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {WHATSAPP_NUMBER && (
              <button
                onClick={handleWhatsAppContact}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Icons.Message className="w-4 h-4" />
                <span>{t.contactWhatsApp}</span>
              </button>
            )}
            <Link
              href="/expert"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-amber-700/60 text-amber-200 font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Icons.Message className="w-4 h-4" />
          <span>{t.askAdvisor}</span>
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
        >
          <Icons.Dashboard className="w-4 h-4 text-emerald-400" />
          <span>{t.dashboard}</span>
        </Link>
        <Link
          href="/diagnose"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold text-sm sm:text-base px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
        >
          <Icons.Camera className="w-4 h-4" />
          <span>{t.scanAnother}</span>
        </Link>
      </div>
    </div>
  );
}
