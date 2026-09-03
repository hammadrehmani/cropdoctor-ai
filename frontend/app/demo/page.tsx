import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Hackathon Demo Guide — CropDoctor AI",
  description: "Comprehensive evaluation guide, 3-minute pitch walkthrough, and known-good test cases for hackathon judges evaluating CropDoctor AI.",
};

const DEMO_TEST_CASES = [
  {
    crop: "Wheat",
    expectedDisease: "Leaf Rust (Puccinia triticina)",
    confidence: "92% – 96%",
    severity: "12% – 18% (Low to Moderate)",
    riskContext: "Faisalabad: 35% – 45% (Optimal sporulation window)",
    keyFeature: "Clear orange-brown pustules with sharp Grad-CAM localization",
  },
  {
    crop: "Cotton",
    expectedDisease: "Cotton Leaf Curl Disease (CLCuD)",
    confidence: "88% – 94%",
    severity: "15% – 25% (Moderate)",
    riskContext: "Multan: 60% – 70% (High whitefly temperature pressure)",
    keyFeature: "Upward leaf curling & vein thickening with Grad-CAM heatmap",
  },
  {
    crop: "Rice",
    expectedDisease: "Rice Blast (Magnaporthe oryzae)",
    confidence: "89% – 95%",
    severity: "20% – 30% (Moderate)",
    riskContext: "Gujranwala: 40% – 55% (High humidity duration)",
    keyFeature: "Spindle-shaped lesions with gray centers",
  },
  {
    crop: "Sugarcane",
    expectedDisease: "Red Rot (Colletotrichum falcatum)",
    confidence: "87% – 93%",
    severity: "25% – 40% (Moderate to Severe)",
    riskContext: "Hyderabad: 50% – 65% (Warm humid conditions)",
    keyFeature: "Red discoloration along midrib with white patches",
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold mb-1">
          <Icons.Award className="w-3.5 h-3.5" />
          <span>Hackathon Evaluation Companion · Judge Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
          Demo &amp; Judge Presentation
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          Interactive companion for evaluating the CropDoctor AI live demo, technical architecture, and responsible AI guardrails.
        </p>
      </div>

      {/* 3-Minute Walkthrough Flow */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Icons.Clock className="w-5 h-5 text-emerald-400" />
            <span>3-Minute Evaluation Walkthrough</span>
          </h2>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60">
            Recommended Sequence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">1. Problem &amp; Core Tagline (0:00–0:30)</div>
            <p className="text-gray-400">Explain why diagnosis alone is insufficient: severity &amp; risk forewarning are required.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">2. Scan &amp; Diagnosis (0:30–1:20)</div>
            <p className="text-gray-400">Capture leaf photo, show multi-stage loading, and inspect top-3 probability outputs.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">3. Severity &amp; Grad-CAM (1:20–1:50)</div>
            <p className="text-gray-400">Verify OpenCV affected area progress bar and inspect visual neural attention heatmap.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">4. Risk Map &amp; 7-Day Forecast (1:50–2:30)</div>
            <p className="text-gray-400">Show Open-Meteo + XGBoost outbreak index and explain centroid privacy protection.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">5. Multilingual Advisor (2:30–3:10)</div>
            <p className="text-gray-400">Ask questions in Urdu &amp; Sindhi; demonstrate dosage refusal safety guardrail.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
            <div className="font-bold text-emerald-400">6. Device Dashboard (3:10–3:40)</div>
            <p className="text-gray-400">Review anonymous device-isolated history and exportable health summaries.</p>
          </div>
        </div>
      </div>

      {/* Known-Good Test Cases Grid */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Icons.Scan className="w-5 h-5 text-emerald-400" />
          <span>Verified Demo Test Cases</span>
        </h2>
        <p className="text-xs text-gray-400">
          Known-good baseline crops and expected model outcomes for live testing:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {DEMO_TEST_CASES.map((tc) => (
            <div
              key={tc.crop}
              className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2 text-xs flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-gray-100 flex items-center gap-1.5">
                    <Icons.Leaf className="w-4 h-4 text-emerald-400" />
                    <span>{tc.crop}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                    {tc.confidence}
                  </span>
                </div>
                <div className="font-bold text-emerald-300">{tc.expectedDisease}</div>
                <div className="text-gray-400"><strong className="text-gray-300">Severity:</strong> {tc.severity}</div>
                <div className="text-gray-400"><strong className="text-gray-300">Risk Context:</strong> {tc.riskContext}</div>
              </div>
              <div className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-[11px] text-gray-400 italic">
                {tc.keyFeature}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launchpad Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/diagnose"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer"
        >
          <Icons.Camera className="w-4 h-4" />
          <span>Launch Scanner Demo</span>
        </Link>
        <Link
          href="/risk-map"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
        >
          <Icons.Map className="w-4 h-4 text-emerald-400" />
          <span>Inspect Risk Map</span>
        </Link>
        <Link
          href="/advisor"
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
        >
          <Icons.Message className="w-4 h-4 text-emerald-400" />
          <span>Test AI Advisor</span>
        </Link>
      </div>
    </div>
  );
}
