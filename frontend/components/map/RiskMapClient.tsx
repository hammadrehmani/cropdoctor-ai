"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { getRiskPoints } from "@/lib/api";
import { Icons } from "@/components/ui/Icons";
import type { CropType, RiskPoint, RiskMapResponse } from "@/lib/types";

const CROPS: { value: CropType; label: string }[] = [
  { value: "wheat", label: "Wheat" },
  { value: "cotton", label: "Cotton" },
  { value: "rice", label: "Rice" },
  { value: "sugarcane", label: "Sugarcane" },
];

function getRiskBadge(label: string | undefined, score?: number) {
  const norm = (label || "").toUpperCase();
  if (norm === "CRITICAL" || (score !== undefined && score >= 0.75)) {
    return {
      label: "CRITICAL",
      bg: "bg-red-50 border-red-200 text-red-700",
      badgeStyle: { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" },
      dot: "bg-red-500",
      border: "border-red-500",
      barColor: "bg-red-500",
      advisory: "Urgent field inspection and agricultural expert consultation required.",
    };
  }
  if (norm === "HIGH" || (score !== undefined && score >= 0.5)) {
    return {
      label: "HIGH",
      bg: "bg-orange-50 border-orange-200 text-orange-700",
      badgeStyle: { background: "#FFEDD5", color: "#9A3412", border: "1px solid #FDBA74" },
      dot: "bg-orange-500",
      border: "border-orange-500",
      barColor: "bg-orange-500",
      advisory: "High disease pressure window; monitor lower leaves closely for lesions.",
    };
  }
  if (norm === "MEDIUM" || (score !== undefined && score >= 0.25)) {
    return {
      label: "MEDIUM",
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      badgeStyle: { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
      dot: "bg-amber-500",
      border: "border-amber-400",
      barColor: "bg-amber-500",
      advisory: "Moderate disease risk; maintain preventive cultural and irrigation practices.",
    };
  }
  return {
    label: "LOW",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
    badgeStyle: { background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
    dot: "bg-emerald-500",
    border: "border-emerald-500",
    barColor: "bg-emerald-500",
    advisory: "Favourable crop growth conditions; minimal disease pressure detected.",
  };
}

export function RiskMapClient() {
  const [selectedCrop, setSelectedCrop] = useState<CropType>("wheat");
  const [mapData, setMapData] = useState<RiskMapResponse | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<RiskPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [, startTransition] = useTransition();

  const loadRiskPoints = useCallback((crop: CropType) => {
    setIsLoading(true);
    setError(null);
    getRiskPoints(crop)
      .then((data) => {
        startTransition(() => {
          setMapData(data);
          if (data.points && data.points.length > 0) {
            setSelectedDistrict(data.points[0]);
          }
          setIsLoading(false);
        });
      })
      .catch((err) => {
        startTransition(() => {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load district risk points. Please retry."
          );
          setIsLoading(false);
        });
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getRiskPoints(selectedCrop)
      .then((data) => {
        if (!isMounted) return;
        startTransition(() => {
          setMapData(data);
          if (data.points && data.points.length > 0) {
            setSelectedDistrict(data.points[0]);
          }
          setIsLoading(false);
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        startTransition(() => {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load district risk points. Please retry."
          );
          setIsLoading(false);
        });
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCrop]);

  const filteredPoints = (mapData?.points || []).filter((p) => {
    if (filterLevel === "ALL") return true;
    return p.risk_label.toUpperCase() === filterLevel;
  });

  const totalPoints = mapData?.points.length || 0;
  const criticalCount = (mapData?.points || []).filter(
    (p) => p.risk_label.toUpperCase() === "CRITICAL" || p.risk_label.toUpperCase() === "HIGH"
  ).length;
  const avgRiskScore =
    totalPoints > 0
      ? (mapData?.points.reduce((acc, p) => acc + p.risk_score, 0) || 0) / totalPoints
      : 0;

  return (
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Page Header — Dark green Croplyx style */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <Icons.Map className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                District Disease Risk Map
              </h1>
            </div>
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
              Live geospatial outbreak risk across Pakistan, powered by Open-Meteo + XGBoost epidemiological risk engine.
            </p>
          </div>

          {/* Crop Selector Chips */}
          <div
            className="flex items-center gap-1.5 p-1.5 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {CROPS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCrop(c.value)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{
                  background: selectedCrop === c.value ? "#16A34A" : "transparent",
                  color: selectedCrop === c.value ? "#ffffff" : "rgba(255,255,255,0.8)",
                }}
              >
                <Icons.Leaf className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 pb-14 space-y-6">

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Districts Monitored
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {isLoading ? "..." : totalPoints}
            </div>
            <div className="text-[10px] text-gray-400">Centroid stations</div>
          </div>

          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              High / Critical Zones
            </span>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#D97706" }}>
              {isLoading ? "..." : criticalCount}
            </div>
            <div className="text-[10px] text-gray-400">Outbreak warnings</div>
          </div>

          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              National Avg Risk
            </span>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: "#16A34A" }}>
              {isLoading ? "..." : `${(avgRiskScore * 100).toFixed(0)}%`}
            </div>
            <div className="text-[10px] text-gray-400">Micro-climate baseline</div>
          </div>

          <div className="card-croplyx p-4 sm:p-5 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Active Crop Target
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 capitalize">
              {selectedCrop}
            </div>
            <div className="text-[10px] text-gray-400">Epidemic profile</div>
          </div>
        </div>

        {/* Risk Legend & Filters Bar */}
        <div className="card-croplyx p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="text-gray-500 font-bold mr-1">Risk Scale:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold" style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
              Low (&lt;25%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
              Medium (25–49%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FFEDD5", color: "#9A3412", border: "1px solid #FDBA74" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#F97316" }} />
              High (50–74%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold" style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />
              Critical (≥75%)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className="px-3 py-1 rounded-full font-bold transition-all cursor-pointer"
                style={{
                  background: filterLevel === lvl ? "#1a3626" : "#F0EDE5",
                  color: filterLevel === lvl ? "#ffffff" : "#374151",
                  border: filterLevel === lvl ? "none" : "1px solid #E5E1D8",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card-croplyx p-12 text-center space-y-4 animate-pulse">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "#E8F5EE", border: "1px solid #BBF7D0" }}
            >
              <Icons.RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#16A34A" }} />
            </div>
            <div className="text-base font-bold text-gray-800">
              Loading district risk data from Open-Meteo &amp; XGBoost...
            </div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Computing micro-climate disease pressure for monitored agricultural zones.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div role="alert" className="card-croplyx p-8 text-center space-y-4">
            <Icons.AlertTriangle className="w-8 h-8 mx-auto" style={{ color: "#D97706" }} />
            <div className="text-sm font-bold text-gray-800">{error}</div>
            <button
              onClick={() => loadRiskPoints(selectedCrop)}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer"
              style={{ background: "#D97706" }}
            >
              Retry Loading Risk Points
            </button>
          </div>
        )}

        {/* Main Interactive Map & Details View */}
        {!isLoading && !error && mapData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spatial Grid / District Map View */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card-croplyx p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "#E5E1D8" }}>
                  <div className="flex items-center gap-2">
                    <Icons.Map className="w-4 h-4" style={{ color: "#16A34A" }} />
                    <span className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                      Regional Risk Stations ({filteredPoints.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Click a district to view telemetry
                  </span>
                </div>

                {/* District Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredPoints.map((point) => {
                    const badge = getRiskBadge(point.risk_label, point.risk_score);
                    const isSelected = selectedDistrict?.district === point.district;

                    return (
                      <button
                        key={point.district}
                        onClick={() => setSelectedDistrict(point)}
                        className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                          isSelected
                            ? "shadow-md ring-2 ring-emerald-600"
                            : "hover:shadow-sm"
                        }`}
                        style={{
                          background: isSelected ? "#ffffff" : "#FAF8F5",
                          border: isSelected ? "2px solid #1a3626" : "1px solid #E5E1D8",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                              <Icons.Map className="w-3.5 h-3.5 shrink-0" style={{ color: "#16A34A" }} />
                              <span>{point.district}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {point.lat.toFixed(2)}°N, {point.lon.toFixed(2)}°E
                            </div>
                          </div>

                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                            style={badge.badgeStyle}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="space-y-1 pt-1" style={{ borderTop: "1px solid #E5E1D8" }}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">Risk Score:</span>
                            <span className="font-black text-gray-900">
                              {(point.risk_score * 100).toFixed(0)}%
                            </span>
                          </div>

                          {point.primary_driver && (
                            <div className="text-[10px] font-medium flex items-center gap-1 truncate" style={{ color: "#15803d" }}>
                              <Icons.Zap className="w-3 h-3 shrink-0" style={{ color: "#16A34A" }} />
                              <span className="truncate">{point.primary_driver}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected District Telemetry Card */}
            <div className="space-y-4">
              {selectedDistrict ? (
                (() => {
                  const badge = getRiskBadge(selectedDistrict.risk_label, selectedDistrict.risk_score);
                  return (
                    <div className="card-croplyx p-6 space-y-5 sticky top-20">
                      <div className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: "#E5E1D8" }}>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            District Telemetry
                          </span>
                          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mt-0.5">
                            <Icons.Map className="w-5 h-5" style={{ color: "#16A34A" }} />
                            <span>{selectedDistrict.district}</span>
                          </h2>
                          <span className="text-xs text-gray-500 capitalize">
                            Crop: <strong>{selectedCrop}</strong>
                          </span>
                        </div>

                        <span
                          className="px-3 py-1 rounded-full text-xs font-black"
                          style={badge.badgeStyle}
                        >
                          {badge.label} RISK
                        </span>
                      </div>

                      {/* Gauge / Score */}
                      <div
                        className="p-4 rounded-2xl space-y-3"
                        style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">
                            Epidemiological Index
                          </span>
                          <span className="text-2xl font-black text-gray-900">
                            {(selectedDistrict.risk_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: "#E5E1D8" }}>
                          <div
                            className={`h-2.5 rounded-full transition-all ${badge.barColor}`}
                            style={{ width: `${Math.max(5, selectedDistrict.risk_score * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Driver & Advisory */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Primary Model Driver
                          </span>
                          <div
                            className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
                            style={{ background: "#E8F5EE", border: "1px solid #BBF7D0", color: "#15803d" }}
                          >
                            <Icons.Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "#16A34A" }} />
                            <span>{selectedDistrict.primary_driver || "Seasonal baseline conditions"}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Agronomic Guidance
                          </span>
                          <p
                            className="text-xs leading-relaxed p-3.5 rounded-xl"
                            style={{ background: "#FAF8F5", border: "1px solid #E5E1D8", color: "#374151" }}
                          >
                            {badge.advisory}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-2 flex flex-col gap-2">
                        <Link
                          href={`/diagnose?district=${encodeURIComponent(selectedDistrict.district)}&crop=${encodeURIComponent(selectedCrop)}`}
                          className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          style={{ background: "#1a3626" }}
                        >
                          <Icons.Scan className="w-4 h-4" />
                          <span>Scan Crop in {selectedDistrict.district}</span>
                        </Link>

                        <Link
                          href="/advisor"
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
                        >
                          <Icons.Message className="w-4 h-4" style={{ color: "#16A34A" }} />
                          <span>Ask AI Advisor about {selectedDistrict.district}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="card-croplyx p-8 text-center text-gray-400 text-xs">
                  Select a district marker from the map to view detailed risk telemetry.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strict Privacy & Scientific Disclaimer Banner */}
        <div
          className="p-5 rounded-2xl space-y-2 text-xs"
          style={{ background: "#FAF8F5", border: "1px solid #E5E1D8", color: "#64748B" }}
        >
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <Icons.Lock className="w-4 h-4" style={{ color: "#16A34A" }} />
            <span>Geo-Privacy &amp; Prototype Notice</span>
          </div>
          <p className="leading-relaxed">
            <strong className="text-gray-800">Privacy Guarantee:</strong> All map markers represent public district centroid reference coordinates. No individual farmer GPS coordinates are ever stored, mapped, or publicly disclosed.
          </p>
          <p className="leading-relaxed text-[11px] text-gray-500">
            <strong className="text-gray-700">Scientific Disclaimer:</strong> Disease risk scores are estimations computed from real Open-Meteo weather parameters and the multi-factor XGBoost model. They provide early advisory indicators and do not replace professional agricultural field scouting or official government surveillance.
          </p>
        </div>
      </div>
    </div>
  );
}
