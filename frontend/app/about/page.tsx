import type { Metadata } from "next";
import Link from "next/link";
import { CROPS } from "@/lib/constants";
import { Icons } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About AgriGuard AI — Crop Disease Intelligence for Pakistan",
  description: "Learn how AgriGuard AI empowers smallholder farmers and agricultural extension officers across Pakistan with explainable AI and proactive risk modeling.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold mb-1">
          <Icons.Globe className="w-3.5 h-3.5" />
          <span>Agricultural Innovation · Smallholder Decision Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
          About AgriGuard AI
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          Empowering Pakistani agriculture with explainable computer vision, automated severity measurement, and micro-climate disease forecasting.
        </p>
      </div>

      {/* Problem & Motivation */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
            <Icons.AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-100">The Smallholder Challenge in Pakistan</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Agriculture constitutes over <strong className="text-gray-100">22% of Pakistan&apos;s GDP</strong> and employs more than 37% of the national labor force. Yet every harvest season, devastating fungal, bacterial, and viral epidemics—such as <strong className="text-amber-300">Wheat Leaf Rust</strong>, <strong className="text-amber-300">Cotton Leaf Curl Virus (CLCuD)</strong>, and <strong className="text-amber-300">Rice Blast</strong>—inflict severe yield losses exceeding tens of billions of rupees.
        </p>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Smallholder farmers typically lack immediate access to certified agronomists and often rely on unverified advice or over-apply broad-spectrum pesticides after irreversible crop damage has already taken hold.
        </p>
      </div>

      {/* Our Solution & Innovation */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Icons.Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-100">The AgriGuard Philosophy</h2>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm font-semibold leading-relaxed">
          &ldquo;AgriGuard does not only identify crop disease. It explains the diagnosis, measures severity, and forecasts district-level risk.&rdquo;
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Icons.Scan className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-200 text-sm">Explainable Vision</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Transparent neural heatmaps (Grad-CAM) prove to farmers and field officers why a specific disease was detected.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Icons.Activity className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-200 text-sm">Severity Quantified</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Automated OpenCV lesion segmentation calculates affected leaf area percentage for objective field triage.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Icons.CloudSun className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-200 text-sm">Predictive Forewarning</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Micro-climate XGBoost models forecast epidemiological risk 7 days in advance to enable timely prevention.
            </p>
          </div>
        </div>
      </div>

      {/* Target Crops & Regional Coverage */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Icons.Leaf className="w-5 h-5 text-emerald-400" />
          <span>Supported Staple &amp; Cash Crops</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          Trained on major agricultural crops cultivated across Punjab, Sindh, Khyber Pakhtunkhwa, and Balochistan:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {CROPS.map((crop) => (
            <div
              key={crop.value}
              className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icons.Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-bold text-gray-200">{crop.label}</span>
              </div>
              <span className="text-xs text-gray-500 font-serif" dir="rtl">{crop.labelUr}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Core Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/diagnose"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base px-8 py-4 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Icons.Camera className="w-4 h-4" />
          <span>Scan a Crop Now</span>
        </Link>
        <Link
          href="/how-it-works"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-bold text-sm sm:text-base px-8 py-4 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Icons.BookOpen className="w-4 h-4 text-emerald-400" />
          <span>See How It Works</span>
        </Link>
      </div>
    </div>
  );
}
