"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDiagnosisHistory, getWeather, ApiError } from "@/lib/api";
import { CROPS, DEMO_DISTRICTS } from "@/lib/constants";
import { Icons } from "@/components/ui/Icons";
import type {
  DiagnosisHistoryItem,
  WeatherRiskResponse,
  CropType,
} from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();

  // ── Diagnosis History State ──────────────────────────────────────────────────
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // ── Weather & Risk State ─────────────────────────────────────────────────────
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Faisalabad");
  const [selectedCrop, setSelectedCrop] = useState<CropType>("wheat");
  const [weatherData, setWeatherData] = useState<WeatherRiskResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // ── Refresh Handlers ─────────────────────────────────────────────────────────
  const refreshHistory = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getDiagnosisHistory(50, 0);
      setHistory(data.items);
      setTotalCount(data.total);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setHistoryError(err.detail || "Failed to load diagnosis history.");
      } else {
        setHistoryError("Unable to connect to the server. Please check your connection.");
      }
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const refreshWeather = async () => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await getWeather(selectedDistrict, selectedCrop);
      setWeatherData(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setWeatherError(err.detail || "Failed to load weather forecast.");
      } else {
        setWeatherError("Unable to load weather forecast. Please check your connection.");
      }
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // ── Mount / Parameter Loaders ────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const data = await getDiagnosisHistory(50, 0);
        if (isMounted) {
          setHistory(data.items);
          setTotalCount(data.total);
          setIsHistoryLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setHistoryError(err.detail || "Failed to load diagnosis history.");
          } else {
            setHistoryError("Unable to connect to the server. Please check your connection.");
          }
          setIsHistoryLoading(false);
        }
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      try {
        const data = await getWeather(selectedDistrict, selectedCrop);
        if (isMounted) {
          setWeatherData(data);
          setIsWeatherLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setWeatherError(err.detail || "Failed to load weather forecast.");
          } else {
            setWeatherError("Unable to load weather forecast. Please check your connection.");
          }
          setIsWeatherLoading(false);
        }
      }
    };
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrict, selectedCrop]);

  // Compute summary stats
  const healthyCount = history.filter(
    (h) => h.disease.toLowerCase().includes("healthy") || h.severity_tier.toLowerCase() === "healthy"
  ).length;

  const diseasedCount = history.length - healthyCount;
  const escalatedCount = history.filter((h) => h.escalated).length;

  // Filter diagnosis items
  const filteredHistory = history.filter((item) => {
    if (activeFilter === "healthy") {
      return item.disease.toLowerCase().includes("healthy") || item.severity_tier.toLowerCase() === "healthy";
    }
    if (activeFilter === "rust") {
      return item.disease.toLowerCase().includes("rust");
    }
    if (activeFilter === "powdery") {
      return item.disease.toLowerCase().includes("powdery");
    }
    if (activeFilter === "escalated") {
      return item.escalated;
    }
    return true;
  });

  // Navigate to advisor with context
  const handleConsultAdvisor = (item: DiagnosisHistoryItem) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "agri_analysis_result",
          JSON.stringify({
            diagnosis: {
              disease: item.disease,
              crop: item.crop,
              confidence: item.confidence,
              uncertain: item.uncertain,
            },
            severity: {
              affected_percentage: item.severity_pct,
              tier: item.severity_tier,
            },
          })
        );
        sessionStorage.setItem("agri_analysis_crop", item.crop);
      } catch {
        // Ignore storage errors
      }
    }
    router.push("/advisor?from=dashboard");
  };

  // Severity Tier Badge Styler
  const getSeverityBadge = (tier: string) => {
    const t = tier.toLowerCase();
    if (t === "healthy") {
      return {
        bg: "bg-emerald-950/80 border-emerald-800/80 text-emerald-300",
        label: "Healthy",
      };
    }
    if (t === "low") {
      return {
        bg: "bg-teal-950/80 border-teal-800/80 text-teal-300",
        label: "Low Severity",
      };
    }
    if (t === "moderate" || t === "medium") {
      return {
        bg: "bg-amber-950/80 border-amber-800/80 text-amber-300",
        label: "Moderate Severity",
      };
    }
    return {
      bg: "bg-red-950/80 border-red-800/80 text-red-300",
      label: "Severe Infection",
    };
  };

  // Weather Risk Styler
  const getWeatherRiskBadge = (label: string) => {
    const l = (label || "").toUpperCase();
    if (l === "LOW") {
      return {
        bg: "bg-emerald-950/80 border-emerald-800/80 text-emerald-300",
        badgeBg: "bg-emerald-600 text-white",
        label: "Low Outbreak Risk",
        desc: "Weather conditions are unfavorable for rapid fungal propagation.",
      };
    }
    if (l === "MEDIUM" || l === "MODERATE") {
      return {
        bg: "bg-amber-950/80 border-amber-800/80 text-amber-300",
        badgeBg: "bg-amber-600 text-black font-bold",
        label: "Moderate Risk",
        desc: "Elevated humidity detected. Regularly inspect fields for early symptoms.",
      };
    }
    return {
      bg: "bg-red-950/80 border-red-800/80 text-red-300",
      badgeBg: "bg-red-600 text-white font-bold",
      label: "High Outbreak Risk",
      desc: "High moisture and optimal temperatures for rapid fungal spore dispersal.",
    };
  };

  // Format date helper
  const formatDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-8 animate-fade-in-up">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-400 font-medium mb-1">
            <Icons.Leaf className="w-3.5 h-3.5" />
            <span>Crop Health Record · Farmer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
            Farmer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Review recent crop diagnoses, weather risks, and verified field actions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/diagnose"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Icons.Camera className="w-4 h-4" />
            <span>Scan Crop</span>
          </Link>
          <Link
            href="/advisor"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 active:scale-98 text-gray-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Icons.Message className="w-4 h-4 text-emerald-400" />
            <span>AI Advisor</span>
          </Link>
        </div>
      </div>

      {/* Anonymous Device Isolation Notice */}
      <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800/90 text-xs text-gray-400 shadow-sm">
        <Icons.Lock className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-emerald-400 font-bold">Anonymous Device History:</span>
        <span>Diagnosis records are securely isolated to this device browser. No registration or login required.</span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Scans */}
        <div className="glass p-3.5 sm:p-4 rounded-2xl border-gray-800 space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Total Scans
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-100">
            {isHistoryLoading ? "..." : totalCount}
          </div>
          <div className="text-[10px] text-gray-500">All-time diagnoses</div>
        </div>

        {/* Healthy Crops */}
        <div className="glass p-3.5 sm:p-4 rounded-2xl border-emerald-900/40 bg-emerald-950/10 space-y-1">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Healthy
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {isHistoryLoading ? "..." : healthyCount}
          </div>
          <div className="text-[10px] text-emerald-400/70">Clear of disease</div>
        </div>

        {/* Active Issues */}
        <div className="glass p-3.5 sm:p-4 rounded-2xl border-amber-900/40 bg-amber-950/10 space-y-1">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Diseased
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
            {isHistoryLoading ? "..." : diseasedCount}
          </div>
          <div className="text-[10px] text-amber-400/70">Under treatment</div>
        </div>

        {/* Escalated */}
        <div className="glass p-3.5 sm:p-4 rounded-2xl border-red-900/40 bg-red-950/10 space-y-1">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
            Escalated
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-300">
            {isHistoryLoading ? "..." : escalatedCount}
          </div>
          <div className="text-[10px] text-red-400/70">Human review</div>
        </div>
      </div>

      {/* ── Weather & Agricultural Disease Risk Section ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Icons.CloudSun className="w-4 h-4" />
              <span>Micro-Climate &amp; Risk</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 tracking-tight">
              7-Day Weather &amp; Disease Outbreak Risk
            </h2>
          </div>

          {/* District & Crop Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* District Selector */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {DEMO_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>

            {/* Crop Selector */}
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropType)}
              className="bg-gray-900 border border-gray-700 text-gray-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Weather Loading State */}
        {isWeatherLoading && (
          <div className="glass p-6 rounded-3xl border-gray-800 animate-pulse space-y-4">
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-28 bg-gray-800/60 rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {/* Weather Error State */}
        {weatherError && !isWeatherLoading && (
          <div role="alert" className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{weatherError}</span>
            </div>
            <button
              onClick={refreshWeather}
              className="px-3 py-1 rounded-lg bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Weather Content Card */}
        {weatherData && !isWeatherLoading && !weatherError && (
          <div className="glass p-5 sm:p-6 rounded-3xl border-gray-800 space-y-5 shadow-lg">
            {/* Overall District Risk Card */}
            {(() => {
              const riskMeta = getWeatherRiskBadge(weatherData.overall_risk_label);
              return (
                <div className={`p-4 rounded-2xl border ${riskMeta.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Icons.ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-100">
                          {selectedDistrict} · {selectedCrop.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${riskMeta.badgeBg}`}>
                          {riskMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {riskMeta.desc}
                      </p>
                      {weatherData.primary_driver && (
                        <div className="text-[11px] text-emerald-400 font-medium pt-1">
                          Primary Model Driver: <span className="text-gray-200">{weatherData.primary_driver}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                        Disease Risk Index
                      </div>
                      <div className="text-xl font-extrabold text-gray-100">
                        {(weatherData.overall_risk_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 7-Day Forecast Micro-Cards (Keeping Weather Forecast Emojis) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {weatherData.forecast.map((day, idx) => {
                const dayRisk = getWeatherRiskBadge(day.risk_label);
                const hasRain = day.rainfall_mm > 0.5;
                const weatherIcon = hasRain ? "🌧️" : day.temperature_mean > 32 ? "☀️" : "⛅";

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-gray-900/90 border border-gray-800/90 flex flex-col justify-between space-y-2 hover:border-gray-700 transition-colors"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-gray-300">
                        {formatDayName(day.date)}
                      </div>
                      <div className="flex items-center gap-1.5 my-1">
                        <span className="text-lg">{weatherIcon}</span>
                        <span className="text-sm font-extrabold text-gray-100">
                          {day.temperature_mean.toFixed(0)}°C
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-gray-400">
                      <div className="flex justify-between">
                        <span>Humidity</span>
                        <span className="text-gray-200 font-medium">{day.humidity_mean.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rain</span>
                        <span className="text-gray-200 font-medium">{day.rainfall_mm.toFixed(1)} mm</span>
                      </div>
                    </div>

                    {/* Daily Risk Tag */}
                    <div className={`mt-1 py-0.5 px-1.5 rounded-md text-[9px] text-center font-bold uppercase tracking-wider ${dayRisk.badgeBg}`}>
                      {day.risk_label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Diagnosis History Section ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Icons.Dashboard className="w-4 h-4" />
              <span>Scan Records</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 tracking-tight">
              Recent Crop Diagnoses
            </h2>
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshHistory}
            disabled={isHistoryLoading}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-xs shrink-0 flex items-center gap-1.5"
            title="Refresh History"
          >
            <Icons.RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "all", label: "All Records" },
            { id: "healthy", label: "Healthy" },
            { id: "rust", label: "Rust" },
            { id: "powdery", label: "Powdery" },
            { id: "escalated", label: "Escalated" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* History Error Card */}
        {historyError && (
          <div role="alert" className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{historyError}</span>
            </div>
            <button
              onClick={refreshHistory}
              className="px-3 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* History Loading Skeleton */}
        {isHistoryLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 rounded-2xl border-gray-800 animate-pulse flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-800" />
                  <div className="space-y-2">
                    <div className="w-32 h-3.5 bg-gray-800 rounded" />
                    <div className="w-24 h-2.5 bg-gray-800 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isHistoryLoading && !historyError && filteredHistory.length === 0 && (
          <div className="glass p-8 sm:p-12 rounded-3xl border-gray-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto">
              <Icons.Leaf className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-200">
                {activeFilter === "all" ? "No Diagnosis History Found" : `No ${activeFilter} Records Found`}
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Upload a leaf photo from your crop to detect infections, estimate damaged area, and receive instant advisor instructions.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/diagnose"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg transition-all"
              >
                <Icons.Scan className="w-4 h-4" />
                <span>Start First Crop Scan</span>
              </Link>
            </div>
          </div>
        )}

        {/* Diagnosis Records List */}
        {!isHistoryLoading && !historyError && filteredHistory.length > 0 && (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const sevBadge = getSeverityBadge(item.severity_tier);
              const dateStr = new Date(item.created_at).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="glass p-4 sm:p-4.5 rounded-2xl border-gray-800 hover:border-gray-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md"
                >
                  {/* Left: Disease & Crop details */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Icons.Leaf className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-100 text-sm">
                          {item.disease}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          ({item.crop})
                        </span>

                        {/* Mock mode label */}
                        {item.is_mock && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider">
                            Demo Record
                          </span>
                        )}

                        {/* Escalated badge */}
                        {item.escalated && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[9px] uppercase tracking-wider">
                            Escalated
                          </span>
                        )}
                      </div>

                      {/* Meta info: date, confidence, district */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Icons.Clock className="w-3 h-3 text-gray-400" />
                          <span>{dateStr}</span>
                        </span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          {(item.confidence * 100).toFixed(1)}% Confidence
                        </span>
                        {item.district && (
                          <>
                            <span>·</span>
                            <span className="text-gray-300">{item.district}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Severity Badge & Quick Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                    {/* Severity Tier */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${sevBadge.bg}`}
                    >
                      <Icons.Activity className="w-3.5 h-3.5" />
                      <span>{sevBadge.label}</span>
                      <span className="text-[10px] opacity-80">
                        ({item.severity_pct.toFixed(1)}%)
                      </span>
                    </div>

                    {/* Ask Advisor CTA */}
                    <button
                      onClick={() => handleConsultAdvisor(item)}
                      className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Ask AI Advisor about this diagnosis"
                    >
                      <Icons.Message className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Advisor</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
