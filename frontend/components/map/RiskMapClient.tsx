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
      bg: "bg-rose-950/80 border-rose-800/80 text-rose-300",
      dot: "bg-rose-500",
      border: "border-rose-500/60",
      glow: "shadow-rose-900/30",
      advisory: "Urgent field inspection and agricultural expert consultation.",
    };
  }
  if (norm === "HIGH" || (score !== undefined && score >= 0.5)) {
    return {
      label: "HIGH",
      bg: "bg-orange-950/80 border-orange-800/80 text-orange-300",
      dot: "bg-orange-500",
      border: "border-orange-500/60",
      glow: "shadow-orange-900/30",
      advisory: "High disease pressure window; monitor lower leaves closely.",
    };
  }
  if (norm === "MEDIUM" || (score !== undefined && score >= 0.25)) {
    return {
      label: "MEDIUM",
      bg: "bg-amber-950/80 border-amber-800/80 text-amber-300",
      dot: "bg-amber-500",
      border: "border-amber-500/60",
      glow: "shadow-amber-900/30",
      advisory: "Moderate disease risk; maintain preventive cultural practices.",
    };
  }
  return {
    label: "LOW",
    bg: "bg-emerald-950/80 border-emerald-800/80 text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-500/60",
    glow: "shadow-emerald-900/30",
    advisory: "Favourable crop growth conditions; minimal disease pressure.",
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Icons.Map className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">
              District Disease Risk Map
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
            Live geospatial outbreak risk across Pakistan, powered by the Open-Meteo + XGBoost risk engine.
          </p>
        </div>

        {/* Crop Selector Chips */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-900/90 border border-gray-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {CROPS.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCrop(c.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCrop === c.value
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Icons.Leaf className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-2xl border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Districts Monitored
          </span>
          <div className="text-xl sm:text-2xl font-black text-gray-100">
            {isLoading ? "..." : totalPoints}
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            High/Critical Outbreaks
          </span>
          <div className="text-xl sm:text-2xl font-black text-orange-400">
            {isLoading ? "..." : criticalCount}
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            National Avg Risk
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {isLoading ? "..." : `${(avgRiskScore * 100).toFixed(0)}%`}
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Active Crop Target
          </span>
          <div className="text-xl sm:text-2xl font-black text-gray-100 capitalize">
            {selectedCrop}
          </div>
        </div>
      </div>

      {/* Risk Legend & Filters Bar */}
      <div className="glass p-4 rounded-2xl border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="text-gray-400 font-bold mr-1">Risk Levels:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Low (&lt;25%)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Medium (25–49%)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-950/80 border border-orange-800/80 text-orange-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            High (50–74%)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Critical (≥75%)
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterLevel === lvl
                  ? "bg-gray-100 text-gray-900"
                  : "bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass p-12 rounded-3xl border-gray-800 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto">
            <Icons.RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="text-base font-bold text-gray-200">
            Loading district risk data from Open-Meteo &amp; XGBoost...
          </div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Computing micro-climate disease pressure for monitored agricultural zones.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div role="alert" className="glass p-8 rounded-3xl border-amber-900/60 bg-amber-950/20 text-center space-y-4">
          <Icons.AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <div className="text-sm font-bold text-amber-200">{error}</div>
          <button
            onClick={() => loadRiskPoints(selectedCrop)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
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
            <div className="glass p-5 rounded-3xl border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Regional Risk Stations ({filteredPoints.length})
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Select a district for deep telemetry
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
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? `bg-gray-900 ${badge.border} shadow-lg ${badge.glow} ring-2 ring-emerald-500/40`
                          : "bg-gray-900/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-sm text-gray-100 flex items-center gap-1.5">
                            <Icons.Map className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{point.district}</span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {point.lat.toFixed(2)}°N, {point.lon.toFixed(2)}°E (Centroid)
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Risk Score:</span>
                          <span className="font-extrabold text-gray-100">
                            {(point.risk_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        {point.primary_driver && (
                          <div className="text-[10px] text-emerald-400/90 truncate font-medium flex items-center gap-1">
                            <Icons.Zap className="w-3 h-3 text-emerald-400 shrink-0" />
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
                  <div className="glass p-6 rounded-3xl border-gray-800 space-y-6 shadow-xl sticky top-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          District Telemetry
                        </span>
                        <h2 className="text-2xl font-black text-gray-100 flex items-center gap-2 mt-0.5">
                          <Icons.Map className="w-5 h-5 text-emerald-400" />
                          <span>{selectedDistrict.district}</span>
                        </h2>
                        <span className="text-xs text-gray-400 capitalize">
                          Crop: {selectedCrop}
                        </span>
                      </div>

                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${badge.bg}`}>
                        {badge.label} RISK
                      </span>
                    </div>

                    {/* Gauge / Score */}
                    <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">
                          Epidemiological Index
                        </span>
                        <span className="text-2xl font-black text-gray-100">
                          {(selectedDistrict.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            selectedDistrict.risk_score >= 0.75
                              ? "bg-rose-500"
                              : selectedDistrict.risk_score >= 0.5
                              ? "bg-orange-500"
                              : selectedDistrict.risk_score >= 0.25
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, selectedDistrict.risk_score * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Driver & Advisory */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Primary Model Driver
                        </span>
                        <div className="p-3 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                          <Icons.Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{selectedDistrict.primary_driver || "Seasonal baseline conditions"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Agronomic Guidance
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed p-3 rounded-xl bg-gray-900/60 border border-gray-800/60">
                          {badge.advisory}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-2 flex flex-col gap-2">
                      <Link
                        href={`/diagnose?district=${encodeURIComponent(selectedDistrict.district)}&crop=${encodeURIComponent(selectedCrop)}`}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Icons.Scan className="w-4 h-4" />
                        <span>Scan Crop in {selectedDistrict.district}</span>
                      </Link>

                      <Link
                        href="/advisor"
                        className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs text-center transition-all border border-gray-700 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Icons.Message className="w-4 h-4 text-emerald-400" />
                        <span>Ask AI Advisor about {selectedDistrict.district}</span>
                      </Link>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="glass p-8 rounded-3xl border-gray-800 text-center text-gray-400 text-xs">
                Select a district marker from the map to view detailed risk telemetry.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strict Privacy & Scientific Disclaimer Banner */}
      <div className="glass p-5 rounded-2xl border-gray-800/80 bg-gray-950/40 space-y-2 text-xs text-gray-400">
        <div className="flex items-center gap-2 font-bold text-gray-200">
          <Icons.Lock className="w-4 h-4 text-emerald-400" />
          <span>Geo-Privacy &amp; Prototype Notice</span>
        </div>
        <p className="leading-relaxed">
          <strong className="text-gray-300">Privacy Guarantee:</strong> All map markers represent public district centroid reference coordinates. No individual farmer GPS coordinates are ever stored, mapped, or publicly disclosed.
        </p>
        <p className="leading-relaxed text-[11px] text-gray-500">
          <strong className="text-gray-400">Scientific Disclaimer:</strong> Disease risk scores are prototype estimations computed from real Open-Meteo weather parameters and the Phase 2 multi-factor XGBoost model. They provide early advisory indicators and do not replace professional agricultural field scouting or official government surveillance.
        </p>
      </div>
    </div>
  );
}
