import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "How It Works — AgriGuard AI",
  description: "Explore the complete 6-step agricultural intelligence pipeline of AgriGuard AI: from mobile leaf upload to explainable Grad-CAM and district risk forecasting.",
};

const PIPELINE_STEPS = [
  {
    step: "01",
    icon: Icons.Camera,
    title: "Leaf Photo Capture & Validation",
    description:
      "The farmer captures or uploads a leaf photo via mobile browser. Strict client-side validation enforces image MIME types (JPEG/PNG/WebP) and a 10 MB payload limit.",
  },
  {
    step: "02",
    icon: Icons.Cpu,
    title: "Neural Vision Classification",
    description:
      "An EfficientNet-B0 convolutional network classifies the disease category, calculating top-1 certainty alongside top-3 probability distributions.",
  },
  {
    step: "03",
    icon: Icons.Activity,
    title: "OpenCV Severity Measurement",
    description:
      "Automated color-space segmentation segments necrotic lesions from healthy leaf tissue, calculating the affected leaf surface area percentage.",
  },
  {
    step: "04",
    icon: Icons.Sparkles,
    title: "Grad-CAM Visual Heatmap",
    description:
      "Gradient-weighted Class Activation Mapping generates a visual attention overlay, proving the model inspected authentic disease pustules rather than background artifacts.",
  },
  {
    step: "05",
    icon: Icons.CloudSun,
    title: "7-Day District Risk Forecasting",
    description:
      "Live micro-climate telemetry from Open-Meteo feeds into an XGBoost model, forecasting 7-day regional disease pressure and identifying primary drivers.",
  },
  {
    step: "06",
    icon: Icons.Message,
    title: "Grounded Multilingual Advisory & Expert Gate",
    description:
      "FAISS RAG retrieves verified extension documents in English, Urdu, or Sindhi. Low-confidence scans (<60%) or dosage inquiries automatically escalate to human experts.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold mb-1">
          <Icons.Zap className="w-3.5 h-3.5" />
          <span>System Architecture · End-to-End Pipeline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
          How AgriGuard AI Works
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          From a single leaf photograph to explainable diagnosis, severity measurement, and proactive epidemiological risk forecasting.
        </p>
      </div>

      {/* 6-Step Visual Timeline */}
      <div className="space-y-4">
        {PIPELINE_STEPS.map((item) => {
          const StepIcon = item.icon;
          return (
            <div
              key={item.step}
              className="glass p-6 rounded-3xl border-gray-800 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shadow-lg hover:border-emerald-700/60 transition-colors"
            >
              <div className="flex items-center justify-between sm:justify-center w-full sm:w-16 sm:h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 shrink-0 p-3 sm:p-0 text-emerald-400">
                <StepIcon className="w-7 h-7" />
                <span className="sm:hidden text-xs font-black text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded">
                  Step {item.step}
                </span>
              </div>

              <div className="space-y-1 flex-1">
                <div className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Step {item.step}
                </div>
                <h2 className="text-lg font-bold text-gray-100">{item.title}</h2>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Flow Diagram Callout */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-gray-800 bg-gray-950/60 space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-100">Ready to test the pipeline?</h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
          Scan an infected leaf photo or inspect the live geospatial disease risk map across Pakistan.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            <Icons.Scan className="w-4 h-4" />
            <span>Launch Scanner</span>
          </Link>
          <Link
            href="/technology"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
          >
            <Icons.Layers className="w-4 h-4 text-emerald-400" />
            <span>Explore Technology Stack</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
