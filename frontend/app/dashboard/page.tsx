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
        bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        label: "Healthy",
      };
    }
    if (t === "low") {
      return {
        bg: "bg-teal-50 border-teal-200 text-teal-800",
        label: "Low Severity",
      };
    }
    if (t === "moderate" || t === "medium") {
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        label: "Moderate Severity",
      };
    }
    return {
      bg: "bg-red-50 border-red-200 text-red-800",
      label: "Severe Infection",
    };
  };

  // Weather Risk Styler
  const getWeatherRiskBadge = (label: string) => {
    const l = (label || "").toUpperCase();
    if (l === "LOW") {
      return {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        badgeBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        label: "Low Outbreak Risk",
        desc: "Weather conditions are unfavorable for rapid fungal propagation.",
      };
    }
    if (l === "MEDIUM" || l === "MODERATE") {
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-900",
        badgeBg: "bg-amber-100 text-amber-800 border border-amber-200",
        label: "Moderate Risk",
        desc: "Elevated humidity detected. Regularly inspect fields for early symptoms.",
      };
    }
    return {
      bg: "bg-red-50 border-red-200 text-red-900",
      badgeBg: "bg-red-100 text-red-800 border border-red-200",
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
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Header Bar — Croplyx deep forest green */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Icons.Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Crop Health Record · Monitoring Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Field Health &amp; Disease Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-xl mt-1 leading-relaxed">
              Review recent crop diagnoses, live micro-climate risks, and verified extension agronomic actions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/diagnose"
              className="inline-flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
              style={{ background: "#16A34A" }}
            >
              <Icons.Camera className="w-4 h-4" />
              <span>Scan Crop</span>
            </Link>
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98"
              style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Icons.Message className="w-4 h-4 text-emerald-400" />
              <span>AI Advisor</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 pb-16 space-y-6">
        {/* Anonymous Device Isolation Notice */}
        <div
          className="flex items-center gap-2.5 p-3.5 rounded-2xl text-xs shadow-sm"
          style={{ background: "#ffffff", border: "1px solid #E5E1D8", color: "#475569" }}
        >
          <Icons.Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-700">Anonymous Device Isolation:</span>
          <span>Diagnosis records are securely isolated to this device browser. No registration or login required.</span>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Scans */}
          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Scans
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {isHistoryLoading ? "..." : totalCount}
            </div>
            <div className="text-[10px] text-gray-400">All-time diagnoses</div>
          </div>

          {/* Healthy Crops */}
          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#16A34A" }}>
              Healthy
            </div>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#16A34A" }}>
              {isHistoryLoading ? "..." : healthyCount}
            </div>
            <div className="text-[10px] text-gray-400">Clear of disease</div>
          </div>

          {/* Active Issues */}
          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#D97706" }}>
              Diseased
            </div>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#D97706" }}>
              {isHistoryLoading ? "..." : diseasedCount}
            </div>
            <div className="text-[10px] text-gray-400">Under observation</div>
          </div>

          {/* Escalated */}
          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#DC2626" }}>
              Escalated
            </div>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#DC2626" }}>
              {isHistoryLoading ? "..." : escalatedCount}
            </div>
            <div className="text-[10px] text-gray-400">Agronomist review</div>
          </div>
        </div>

        {/* ── Weather & Agricultural Disease Risk Section ──────────────────────── */}
        <div className="card-croplyx p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "#E5E1D8" }}>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "#16A34A" }}>
                <Icons.CloudSun className="w-4 h-4" />
                <span>Micro-Climate &amp; Outbreak Risk</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mt-0.5">
                7-Day Weather &amp; Disease Forecast
              </h2>
            </div>

            {/* District & Crop Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ background: "#FAF8F5", border: "1px solid #D1CEC8", color: "#1E293B" }}
              >
                {DEMO_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>

              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value as CropType)}
                className="text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer"
                style={{ background: "#FAF8F5", border: "1px solid #D1CEC8", color: "#1E293B" }}
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
            <div className="p-8 text-center animate-pulse space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
              <div className="text-xs text-gray-500">Loading Open-Meteo micro-climate telemetry...</div>
            </div>
          )}

          {/* Weather Error State */}
          {weatherError && !isWeatherLoading && (
            <div
              role="alert"
              className="p-4 rounded-2xl text-xs flex items-center justify-between gap-3"
              style={{ background: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }}
            >
              <div className="flex items-center gap-2">
                <Icons.AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{weatherError}</span>
              </div>
              <button
                onClick={refreshWeather}
                className="px-3 py-1 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors"
                style={{ background: "#D97706" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Weather Content Card */}
          {weatherData && !isWeatherLoading && !weatherError && (
            <div className="space-y-4">
              {/* Overall District Risk Card */}
              {(() => {
                const riskMeta = getWeatherRiskBadge(weatherData.overall_risk_label);
                return (
                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ background: "#FAF8F5", borderColor: "#E5E1D8" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#E8F5EE", color: "#16A34A" }}
                      >
                        <Icons.ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            {selectedDistrict} · {selectedCrop.toUpperCase()}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${riskMeta.badgeBg}`}>
                            {riskMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {riskMeta.desc}
                        </p>
                        {weatherData.primary_driver && (
                          <div className="text-[11px] font-medium pt-1" style={{ color: "#15803d" }}>
                            Primary Model Driver: <span className="text-gray-700">{weatherData.primary_driver}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                          Disease Risk Index
                        </div>
                        <div className="text-2xl font-black text-gray-900">
                          {(weatherData.overall_risk_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 7-Day Forecast Micro-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {weatherData.forecast.map((day, idx) => {
                  const dayRisk = getWeatherRiskBadge(day.risk_label);
                  const hasRain = day.rainfall_mm > 0.5;
                  const weatherIcon = hasRain ? "🌧️" : day.temperature_mean > 32 ? "☀️" : "⛅";

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl flex flex-col justify-between space-y-2 transition-all hover:shadow-sm"
                      style={{ background: "#ffffff", border: "1px solid #E5E1D8" }}
                    >
                      <div>
                        <div className="text-[11px] font-bold text-gray-700">
                          {formatDayName(day.date)}
                        </div>
                        <div className="flex items-center gap-1.5 my-1">
                          <span className="text-lg">{weatherIcon}</span>
                          <span className="text-sm font-black text-gray-900">
                            {day.temperature_mean.toFixed(0)}°C
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[10px] text-gray-500">
                        <div className="flex justify-between">
                          <span>Humidity</span>
                          <span className="text-gray-800 font-semibold">{day.humidity_mean.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rain</span>
                          <span className="text-gray-800 font-semibold">{day.rainfall_mm.toFixed(1)} mm</span>
                        </div>
                      </div>

                      {/* Daily Risk Tag */}
                      <div className={`mt-1 py-0.5 px-1.5 rounded-full text-[9px] text-center font-bold uppercase tracking-wider ${dayRisk.badgeBg}`}>
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
        <div className="card-croplyx p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 border-b pb-4" style={{ borderColor: "#E5E1D8" }}>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "#16A34A" }}>
                <Icons.Dashboard className="w-4 h-4" />
                <span>Scan Records</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mt-0.5">
                Recent Crop Diagnoses
              </h2>
            </div>

            {/* Refresh button */}
            <button
              onClick={refreshHistory}
              disabled={isHistoryLoading}
              className="p-2 px-3 rounded-xl transition-colors cursor-pointer text-xs shrink-0 flex items-center gap-1.5 font-semibold"
              style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
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
                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background: activeFilter === tab.id ? "#1a3626" : "#F0EDE5",
                  color: activeFilter === tab.id ? "#ffffff" : "#374151",
                  border: activeFilter === tab.id ? "none" : "1px solid #E5E1D8",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* History Error Card */}
          {historyError && (
            <div
              role="alert"
              className="p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fade-in-up"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
            >
              <div className="flex items-center gap-2">
                <Icons.AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{historyError}</span>
              </div>
              <button
                onClick={refreshHistory}
                className="px-3 py-1 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors"
                style={{ background: "#DC2626" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* History Loading Skeleton */}
          {isHistoryLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl animate-pulse flex items-center justify-between gap-4" style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-32 h-3.5 bg-gray-200 rounded" />
                      <div className="w-24 h-2.5 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isHistoryLoading && !historyError && filteredHistory.length === 0 && (
            <div className="p-8 sm:p-12 text-center space-y-4 rounded-2xl" style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "#E8F5EE", color: "#16A34A" }}
              >
                <Icons.Leaf className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800">
                  {activeFilter === "all" ? "No Diagnosis History Found" : `No ${activeFilter} Records Found`}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Upload a leaf photo from your crop to detect infections, estimate damaged area, and receive instant advisor instructions.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/diagnose"
                  className="inline-flex items-center gap-2 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
                  style={{ background: "#1a3626" }}
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
                    className="p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md"
                    style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
                  >
                    {/* Left: Disease & Crop details */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#E8F5EE", color: "#16A34A" }}
                      >
                        <Icons.Leaf className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">
                            {item.disease}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold capitalize">
                            ({item.crop})
                          </span>

                          {/* Mock mode label */}
                          {item.is_mock && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] uppercase tracking-wider">
                              Demo Record
                            </span>
                          )}

                          {/* Escalated badge */}
                          {item.escalated && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[9px] uppercase tracking-wider">
                              Escalated
                            </span>
                          )}
                        </div>

                        {/* Meta info: date, confidence, district */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icons.Clock className="w-3 h-3 text-gray-400" />
                            <span>{dateStr}</span>
                          </span>
                          <span>·</span>
                          <span className="font-bold" style={{ color: "#15803d" }}>
                            {(item.confidence * 100).toFixed(1)}% Confidence
                          </span>
                          {item.district && (
                            <>
                              <span>·</span>
                              <span className="text-gray-700">{item.district}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Severity Badge & Quick Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: "#E5E1D8" }}>
                      {/* Severity Tier */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sevBadge.bg}`}
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
                        className="p-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
                        title="Ask AI Advisor about this diagnosis"
                      >
                        <Icons.Message className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                        <span className="hidden sm:inline">Ask Advisor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
