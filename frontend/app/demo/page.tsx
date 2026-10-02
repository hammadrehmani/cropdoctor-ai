"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

interface TestCase {
  crop: string;
  cropValue: string;
  expectedDisease: string;
  pathogen: string;
  confidence: string;
  confidencePercent: number;
  severity: string;
  severityColor: string;
  district: string;
  riskContext: string;
  keyFeature: string;
}

const DEMO_TEST_CASES: TestCase[] = [
  {
    crop: "Wheat (گندم)",
    cropValue: "wheat",
    expectedDisease: "Wheat Leaf Rust",
    pathogen: "Puccinia triticina",
    confidence: "94.6%",
    confidencePercent: 95,
    severity: "12.8% (Low Severity)",
    severityColor: "#16a34a",
    district: "Faisalabad",
    riskContext: "Optimal humidity sporulation window (38% risk)",
    keyFeature: "Distinct orange-brown urediniospores localized sharply by Grad-CAM heatmap.",
  },
  {
    crop: "Cotton (کپاس)",
    cropValue: "cotton",
    expectedDisease: "Cotton Leaf Curl Disease",
    pathogen: "CLCuD Geminivirus",
    confidence: "91.2%",
    confidencePercent: 91,
    severity: "22.4% (Moderate)",
    severityColor: "#eab308",
    district: "Multan",
    riskContext: "High temperature vector window for whitefly (65% risk)",
    keyFeature: "Upward leaf enation and vein swelling with clear leaf margin activation.",
  },
  {
    crop: "Rice (چاول)",
    cropValue: "rice",
    expectedDisease: "Rice Blast",
    pathogen: "Magnaporthe oryzae",
    confidence: "93.0%",
    confidencePercent: 93,
    severity: "18.5% (Moderate)",
    severityColor: "#eab308",
    district: "Gujranwala",
    riskContext: "Extended dew duration & high RH (48% risk)",
    keyFeature: "Elliptical diamond-shaped necrotic lesions with ashen-gray centers.",
  },
  {
    crop: "Sugarcane (کماد)",
    cropValue: "sugarcane",
    expectedDisease: "Red Rot",
    pathogen: "Colletotrichum falcatum",
    confidence: "89.5%",
    confidencePercent: 90,
    severity: "34.0% (Severe)",
    severityColor: "#ef4444",
    district: "Hyderabad",
    riskContext: "Monsoon humidity & warm temperatures (58% risk)",
    keyFeature: "Longitudinal midrib reddening with interspersed white blotches.",
  },
];

const PITCH_TIMELINE = [
  {
    time: "0:00 – 0:30",
    stage: "Problem & Value Proposition",
    icon: Icons.Target,
    badge: "The Hook",
    dialogue:
      "Most existing crop apps are black-box classifiers. CropDoctor AI changes the paradigm: we do not just identify diseases; we explain the visual evidence with Grad-CAM, measure OpenCV lesion severity, forecast 7-day district risks via XGBoost, and protect farmer GPS privacy.",
    action: "Show landing page highlights & capability badges.",
    href: "/",
    linkText: "View Landing Hero",
  },
  {
    time: "0:30 – 1:15",
    stage: "Live Leaf Photo Scan",
    icon: Icons.Camera,
    badge: "Neural Vision",
    dialogue:
      "Demonstrate mobile upload. Watch the transparent 4-stage pipeline analyze symptoms, invoke the EfficientNet-B0 backbone, calculate color segmentation, and compute neural activation heatmaps.",
    action: "Select Wheat, choose Faisalabad, and upload sample leaf photo.",
    href: "/diagnose",
    linkText: "Open Scanner",
  },
  {
    time: "1:15 – 1:55",
    stage: "Grad-CAM & Severity Quantification",
    icon: Icons.Sparkles,
    badge: "Explainable AI",
    dialogue:
      "Inspect the result card: 94.6% certainty, 12.8% OpenCV affected leaf area, and the side-by-side Grad-CAM heatmap proving the model focused on real fungal pustules rather than background dirt.",
    action: "Toggle original vs Grad-CAM overlay and point out lesion severity bar.",
    href: "/results",
    linkText: "Inspect Results View",
  },
  {
    time: "1:55 – 2:35",
    stage: "District Risk Forewarning & Geo-Privacy",
    icon: Icons.Map,
    badge: "Predictive Analytics",
    dialogue:
      "Show how live micro-climate telemetry from Open-Meteo feeds our XGBoost model. Highlight that all 30 Pakistan markers represent public district centroids with jitter—never raw farmer GPS coordinates.",
    action: "Filter by crop on Risk Map and click Faisalabad or Multan marker.",
    href: "/risk-map",
    linkText: "Explore Risk Map",
  },
  {
    time: "2:35 – 3:15",
    stage: "Multilingual AI Advisor & Safety Gate",
    icon: Icons.Message,
    badge: "Responsible AI",
    dialogue:
      "Carry scan context directly into an Urdu or Sindhi advisory chat. Ask for organic cultural practices, then test our strict safety refusal on chemical dosage queries.",
    action: "Ask in Urdu and demonstrate pesticide dosage interception.",
    href: "/advisor",
    linkText: "Launch AI Advisor",
  },
  {
    time: "3:15 – 3:45",
    stage: "Device History & Extension Escalation",
    icon: Icons.Dashboard,
    badge: "Zero-Password UX",
    dialogue:
      "Showcase device-isolated history using anonymous UUIDs. Low-confidence scans (<60%) provide one-tap escalation to official agricultural extension hotlines (0800-15000).",
    action: "Review anonymous scan log and export summary card.",
    href: "/dashboard",
    linkText: "Open Dashboard",
  },
];

const EVALUATION_PILLARS = [
  {
    title: "Explainability & Vision Rigor",
    badge: "PyTorch + Grad-CAM",
    icon: Icons.Cpu,
    description:
      "Compound-scaled EfficientNet-B0 CNN combined with Gradient-weighted Class Activation Mapping eliminates black-box skepticism for farmers and field officers.",
  },
  {
    title: "Lesion Severity Quantification",
    badge: "Deterministic OpenCV",
    icon: Icons.Activity,
    description:
      "Automated HSV/Lab color-space segmentation measures leaf damage percentage, replacing subjective guesswork with reproducible field triage.",
  },
  {
    title: "Micro-Climate Forecasting",
    badge: "XGBoost + Open-Meteo",
    icon: Icons.CloudSun,
    description:
      "Proactive 7-day epidemiological risk indices computed from live temperature, relative humidity, precipitation, and wind telemetry across 30 Pakistan districts.",
  },
  {
    title: "Responsible Agronomic AI",
    badge: "Safety Guardrails",
    icon: Icons.ShieldCheck,
    description:
      "Strict algorithmic refusal of synthetic pesticide dosage calculations to prevent phytotoxicity, paired with zero-storage GPS centroid privacy.",
  },
];

const SAMPLE_PROMPTS = [
  {
    lang: "Urdu (اردو)",
    type: "Organic Cultural Management",
    prompt: "گندم کے زنگ (Wheat Leaf Rust) کے تدارک کے لیے قدرتی اور زرعی تدابیر کیا ہیں؟",
  },
  {
    lang: "English (Chemical Safety Test)",
    type: "Dosage Refusal Guardrail",
    prompt: "Give me the exact pesticide dosage in ml per acre to spray on my wheat field tomorrow.",
  },
  {
    lang: "Sindhi (سنڌي)",
    type: "Regional Guidance",
    prompt: "سنڌ جي موسم ۾ چانورن جي بيمارين کان بچاءَ لاءِ ڇا احتياط ڪرڻ گهرجي؟",
  },
];

export default function DemoPage() {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0EDE5" }}>
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER BANNER — Signature Croplyx Deep Forest Green
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden text-white pt-10 pb-16 px-4 sm:px-6"
        style={{
          backgroundColor: "#1a3626",
          backgroundImage: `
            radial-gradient(ellipse at 20% 40%, rgba(74, 154, 107, 0.22) 0%, transparent 60%),
            radial-gradient(ellipse at 85% 20%, rgba(233, 168, 0, 0.12) 0%, transparent 50%)
          `,
        }}
      >
        <div className="mx-auto max-w-6xl relative z-10 space-y-6">
          {/* Top Row: Hackathon Badge & Quick Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "rgba(233, 168, 0, 0.15)",
                border: "1px solid rgba(233, 168, 0, 0.4)",
                color: "#E9A800",
              }}
            >
              <Icons.Award className="w-4 h-4 text-[#E9A800]" />
              <span>Hackathon Evaluation &amp; Pitch Companion</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Demo Ready · 58/58 Tests Verified
              </span>
            </div>
          </div>

          {/* Heading & Tagline */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              CropDoctor AI <span style={{ color: "#E9A800" }}>Judge Guide</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
              A comprehensive walk-through companion for hackathon judges evaluating our end-to-end intelligent crop health system: from leaf vision and Grad-CAM explainability to automated severity and 7-day predictive district risk.
            </p>
          </div>

          {/* Key Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pitch Duration</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">3 – 5 Mins</div>
              <div className="text-[11px] text-emerald-400 font-medium">Timed narrative flow</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Classifier Benchmark</div>
              <div className="text-xl sm:text-2xl font-black text-[#E9A800] mt-0.5">98.0%</div>
              <div className="text-[11px] text-gray-300 font-medium">EfficientNet-B0 test split</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Geo-Privacy</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">Zero GPS</div>
              <div className="text-[11px] text-emerald-400 font-medium">30 Pakistan centroids</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">System Safety</div>
              <div className="text-xl sm:text-2xl font-black text-[#E9A800] mt-0.5">100% Gated</div>
              <div className="text-[11px] text-gray-300 font-medium">Zero dosage synthesis</div>
            </div>
          </div>

          {/* Quick Jump Action Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/diagnose"
              className="btn-gold text-xs sm:text-sm font-bold shadow-lg"
            >
              <Icons.Camera className="w-4 h-4" />
              <span>Launch Live Scanner</span>
            </Link>
            <Link
              href="/risk-map"
              className="btn-outline-white text-xs sm:text-sm font-semibold"
            >
              <Icons.Map className="w-4 h-4" />
              <span>Live Outbreak Risk Map</span>
            </Link>
            <Link
              href="/advisor"
              className="btn-outline-white text-xs sm:text-sm font-semibold"
            >
              <Icons.Message className="w-4 h-4" />
              <span>AI Advisor (Urdu / Sindhi)</span>
            </Link>
            <Link
              href="/dashboard"
              className="btn-outline-white text-xs sm:text-sm font-semibold"
            >
              <Icons.Dashboard className="w-4 h-4" />
              <span>Farmer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT CONTAINER — Elevated on Warm Cream
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-8 pb-20 space-y-10">

        {/* 1. 3-MINUTE PITCH WALKTHROUGH */}
        <section className="card-croplyx p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5" style={{ borderColor: "#E5E1D8" }}>
            <div>
              <div className="section-label mb-2">
                <Icons.Clock className="w-3.5 h-3.5 text-[#1a3626]" />
                <span>Presentation Script</span>
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: "#1a3626" }}>
                3-Minute Hackathon Pitch Walkthrough
              </h2>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#6B7280" }}>
                Recommended sequence and key talking points to guide judges through the live demo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Total Time: 3:45 Max
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PITCH_TIMELINE.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.time}
                  className="rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: "#FAF9F5",
                    borderColor: "#E5E1D8",
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-black px-2.5 py-0.5 rounded-full"
                        style={{ background: "#1a3626", color: "#FFFFFF" }}
                      >
                        {step.time}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: "rgba(233, 168, 0, 0.15)", color: "#B8860B" }}
                      >
                        {step.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(45, 106, 79, 0.12)", color: "#1a3626" }}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm leading-tight" style={{ color: "#1a1a1a" }}>
                        {idx + 1}. {step.stage}
                      </h3>
                    </div>

                    <p className="text-xs leading-relaxed italic p-2.5 rounded-xl bg-white border border-[#E5E1D8]" style={{ color: "#374151" }}>
                      &ldquo;{step.dialogue}&rdquo;
                    </p>

                    <div className="text-[11px] font-medium" style={{ color: "#6B7280" }}>
                      <strong className="text-gray-900">What to click:</strong> {step.action}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-[#E5E1D8]">
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                      style={{ color: "#1a3626" }}
                    >
                      <span>{step.linkText}</span>
                      <Icons.ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. VERIFIED BENCHMARK TEST CASES FOR JUDGES */}
        <section className="card-croplyx p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5" style={{ borderColor: "#E5E1D8" }}>
            <div>
              <div className="section-label mb-2">
                <Icons.Scan className="w-3.5 h-3.5 text-[#1a3626]" />
                <span>Live Verification</span>
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: "#1a3626" }}>
                Verified Demo Test Cases
              </h2>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#6B7280" }}>
                Known-good baseline crops and expected model outcomes for live judge interaction.
              </p>
            </div>
            <Link
              href="/diagnose"
              className="btn-gold text-xs font-bold py-2.5 px-5 self-start sm:self-auto"
            >
              <Icons.Camera className="w-4 h-4" />
              <span>Test Case in Scanner</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEMO_TEST_CASES.map((tc) => (
              <div
                key={tc.crop}
                className="rounded-2xl p-5 border flex flex-col justify-between transition-all hover:shadow-lg"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E1D8",
                }}
              >
                <div className="space-y-3">
                  {/* Card Header: Crop & Certainty */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold"
                        style={{ background: "#F0EDE5", color: "#1a3626" }}
                      >
                        <Icons.Leaf className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-base" style={{ color: "#1a1a1a" }}>
                        {tc.crop}
                      </span>
                    </div>
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: "#1a3626" }}
                    >
                      {tc.confidence} Certainty
                    </span>
                  </div>

                  {/* Target Disease & Pathogen */}
                  <div className="p-3 rounded-xl bg-[#F0EDE5]/60 border border-[#E5E1D8]">
                    <div className="text-xs text-gray-500 font-semibold">Expected Diagnosis</div>
                    <div className="text-sm font-extrabold text-[#1a3626]">{tc.expectedDisease}</div>
                    <div className="text-[11px] text-gray-600 italic">{tc.pathogen}</div>
                  </div>

                  {/* Metrics: Severity & Risk */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF9F5]">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">OpenCV Severity</div>
                      <div className="font-bold mt-0.5" style={{ color: tc.severityColor }}>
                        {tc.severity}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF9F5]">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">District Context</div>
                      <div className="font-bold text-gray-800 mt-0.5">
                        {tc.district}
                      </div>
                    </div>
                  </div>

                  {/* Key Feature & Grad-CAM detail */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs">
                    <div className="text-[11px] font-bold text-gray-500 mb-0.5">Visual Explainability Signal:</div>
                    <p className="text-gray-700 leading-relaxed font-medium">
                      {tc.keyFeature}
                    </p>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="pt-4 mt-3 border-t border-[#E5E1D8] flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    District: <strong className="text-gray-800">{tc.district}</strong>
                  </span>
                  <Link
                    href={`/diagnose?crop=${tc.cropValue}&district=${tc.district}`}
                    className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                    style={{ color: "#1a3626" }}
                  >
                    <span>Load Preset in Scanner</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. JUDGING CRITERIA & ARCHITECTURAL DEFENSE */}
        <section className="card-croplyx p-6 sm:p-8 space-y-6">
          <div className="border-b pb-5" style={{ borderColor: "#E5E1D8" }}>
            <div className="section-label mb-2">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-[#1a3626]" />
              <span>Judging Rubric Defense</span>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#1a3626" }}>
              Core Hackathon Scoring Pillars
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "#6B7280" }}>
              How CropDoctor AI directly satisfies the evaluation criteria for technical excellence and impact.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EVALUATION_PILLARS.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl border transition-all hover:shadow-md"
                  style={{ backgroundColor: "#FAF9F5", borderColor: "#E5E1D8" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: "#1a3626", color: "#FFFFFF" }}
                    >
                      <PillarIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold mb-1.5" style={{ color: "#1a3626" }}>
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. INTERACTIVE SAMPLE PROMPTS FOR LIVE CHAT */}
        <section className="card-croplyx p-6 sm:p-8 space-y-5">
          <div className="border-b pb-5" style={{ borderColor: "#E5E1D8" }}>
            <div className="section-label mb-2">
              <Icons.Message className="w-3.5 h-3.5 text-[#1a3626]" />
              <span>Live Demonstration Prompts</span>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#1a3626" }}>
              Copy-and-Paste Test Prompts for AI Advisor
            </h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: "#6B7280" }}>
              Click any prompt below to copy it for testing multilingual retrieval and safety guardrails in the AI Advisor.
            </p>
          </div>

          <div className="space-y-3">
            {SAMPLE_PROMPTS.map((sp) => (
              <div
                key={sp.prompt}
                className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-[#1a3626]"
                style={{ backgroundColor: "#FAF9F5", borderColor: "#E5E1D8" }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#1a3626", color: "#FFFFFF" }}
                    >
                      {sp.lang}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">· {sp.type}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 pt-1 select-all">
                    &ldquo;{sp.prompt}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(sp.prompt)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer"
                    style={{
                      backgroundColor: copiedPrompt === sp.prompt ? "#16a34a" : "#FFFFFF",
                      color: copiedPrompt === sp.prompt ? "#FFFFFF" : "#1a3626",
                      borderColor: copiedPrompt === sp.prompt ? "#16a34a" : "#E5E1D8",
                    }}
                  >
                    {copiedPrompt === sp.prompt ? (
                      <>
                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Icons.Sparkles className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/advisor"
                    className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl text-white transition-all"
                    style={{ backgroundColor: "#1a3626" }}
                  >
                    <span>Test in Advisor</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. SYSTEM HEALTH & TECHNICAL INTEGRITY CHECKLIST */}
        <section className="card-croplyx p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5" style={{ borderColor: "#E5E1D8" }}>
            <div>
              <div className="section-label mb-2">
                <Icons.Activity className="w-3.5 h-3.5 text-[#1a3626]" />
                <span>Verification Checklist</span>
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: "#1a3626" }}>
                Production Readiness &amp; Integrity
              </h2>
            </div>
            <Link
              href="/technology"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a3626] hover:underline"
            >
              <span>Full Technology Specs</span>
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>FastAPI Backend</span>
              </div>
              <p className="text-gray-600 text-[11px]">58/58 Automated Pytests passing with async SQLAlchemy 2.0.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Vision &amp; Grad-CAM</span>
              </div>
              <p className="text-gray-600 text-[11px]">EfficientNet-B0 (16MB checkpoint) with layer4 gradient activation maps.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Micro-Climate Risk</span>
              </div>
              <p className="text-gray-600 text-[11px]">XGBoost gradient boosted trees with Open-Meteo 7-day live vectors.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Geo-Privacy Layer</span>
              </div>
              <p className="text-gray-600 text-[11px]">30 Pakistan district centroids loaded; zero raw farmer coordinates stored.</p>
            </div>
          </div>
        </section>

        {/* 6. CALL TO ACTION FOOTER BANNER */}
        <div
          className="rounded-3xl p-8 sm:p-10 text-center text-white space-y-4 shadow-xl"
          style={{
            backgroundColor: "#1a3626",
            backgroundImage: "radial-gradient(ellipse at 50% 50%, rgba(74, 154, 107, 0.25) 0%, transparent 70%)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mx-auto"
            style={{
              background: "rgba(233, 168, 0, 0.2)",
              color: "#E9A800",
              border: "1px solid rgba(233, 168, 0, 0.4)",
            }}
          >
            <Icons.Sparkles className="w-4 h-4 text-[#E9A800]" />
            <span>Ready for the Judges</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Start Live Evaluation Now
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Begin with a live leaf diagnosis or inspect the 7-day district epidemiological risk map across Pakistan.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/diagnose"
              className="btn-gold text-xs sm:text-sm font-bold shadow-xl"
            >
              <Icons.Camera className="w-4 h-4" />
              <span>Launch Crop Scanner</span>
            </Link>
            <Link
              href="/risk-map"
              className="btn-outline-white text-xs sm:text-sm font-bold"
            >
              <Icons.Map className="w-4 h-4" />
              <span>Inspect Geospatial Map</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
