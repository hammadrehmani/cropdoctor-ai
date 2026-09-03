import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Technology & Architecture — CropDoctor AI",
  description: "Deep dive into the machine learning models, computer vision heuristics, RAG architecture, and cloud deployment of CropDoctor AI.",
};

const TECH_COMPONENTS = [
  {
    title: "1. Computer Vision & Explainability",
    badge: "PyTorch & Grad-CAM",
    icon: Icons.Scan,
    details: [
      { label: "Neural Backbone", val: "EfficientNet-B0 (Compound scaled CNN)" },
      { label: "Explainability Algorithm", val: "Grad-CAM (Final Conv Layer Activation Maps)" },
      { label: "Target Crops", val: "Cotton, Wheat, Rice, Sugarcane" },
      { label: "Confidence Gating", val: "Below 50% flags uncertain=True; below 60% escalates to expert" },
    ],
  },
  {
    title: "2. Lesion Severity Estimation",
    badge: "OpenCV Python",
    icon: Icons.Activity,
    details: [
      { label: "Segmentation Technique", val: "HSV / Lab Color-Space Thresholding" },
      { label: "Output Metric", val: "Affected Surface Area Percentage (0.0% – 100.0%)" },
      { label: "Severity Tiers", val: "Healthy (<5%), Low (5–24%), Moderate (25–49%), Severe (≥50%)" },
      { label: "Design Rationale", val: "Deterministic, fast CPU heuristic avoiding heavy pixel-mask labeling" },
    ],
  },
  {
    title: "3. Epidemiological Risk Engine",
    badge: "XGBoost & Open-Meteo",
    icon: Icons.CloudSun,
    details: [
      { label: "Model Architecture", val: "XGBoost Gradient-Boosted Decision Trees" },
      { label: "Input Telemetry", val: "Temperature mean/min/max, relative humidity, rain, wind speed" },
      { label: "Forecast Horizon", val: "7-Day rolling predictive window" },
      { label: "Explainability Output", val: "Primary meteorological driver attribution" },
    ],
  },
  {
    title: "4. Multilingual RAG Advisor",
    badge: "FAISS & Qwen LLM",
    icon: Icons.Message,
    details: [
      { label: "Vector Index", val: "FAISS CPU cosine similarity vector store" },
      { label: "Dense Embeddings", val: "paraphrase-multilingual-MiniLM-L12-v2 (384 dimensions)" },
      { label: "Generation Engine", val: "Qwen-Turbo via DashScope / Model Studio" },
      { label: "Languages Supported", val: "English (en), Urdu (ur), Sindhi (sd)" },
      { label: "Safety Guardrail", val: "Strict refusal & expert routing for chemical pesticide dosage queries" },
    ],
  },
  {
    title: "5. Geo-Privacy & Device Isolation",
    badge: "Privacy Layer",
    icon: Icons.Lock,
    details: [
      { label: "GPS Protection", val: "Haversine nearest centroid mapping; zero raw farmer coordinates stored" },
      { label: "Device Persistence", val: "Anonymous UUID device_id stored in localStorage" },
      { label: "History Isolation", val: "Strict database filtering per device without passwords or accounts" },
      { label: "Database", val: "SQLite with SQLAlchemy 2.x async ORM (ApsaraDB RDS ready)" },
    ],
  },
  {
    title: "6. Production & Cloud Readiness",
    badge: "Docker & Alibaba Cloud",
    icon: Icons.Layers,
    details: [
      { label: "Containerization", val: "Multi-stage Dockerfiles with healthchecks & Docker Compose" },
      { label: "Target Cloud", val: "Alibaba Cloud ECS (Compute), OSS (Assets), Model Studio (Qwen)" },
      { label: "Deployment Status", val: "Local production verified; cloud pending organizer credentials" },
      { label: "Observability", val: "Standardized logging, /health, and /ready active probing" },
    ],
  },
];

export default function TechnologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold mb-1">
          <Icons.Cpu className="w-3.5 h-3.5" />
          <span>Technical Specifications · Open &amp; Explainable AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
          Technology &amp; Architecture
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          Comprehensive technical overview of the computer vision, OpenCV heuristics, gradient boosting, and retrieval-augmented generation models powering CropDoctor AI.
        </p>
      </div>

      {/* Component Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TECH_COMPONENTS.map((comp) => {
          const CompIcon = comp.icon;
          return (
            <div
              key={comp.title}
              className="glass p-6 rounded-3xl border-gray-800 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <CompIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gray-900 border border-gray-800 text-emerald-400">
                    {comp.badge}
                  </span>
                </div>

                <h2 className="text-base font-bold text-gray-100">{comp.title}</h2>

                <div className="space-y-2 pt-1">
                  {comp.details.map((d) => (
                    <div key={d.label} className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800/80 text-xs space-y-0.5">
                      <div className="font-semibold text-gray-400 text-[11px]">{d.label}</div>
                      <div className="text-gray-200 font-medium">{d.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture CTA */}
      <div className="glass p-6 rounded-3xl border-gray-800 text-center space-y-3">
        <h2 className="text-lg font-bold text-gray-100">Review the Safety &amp; Governance Charter</h2>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Understand how CropDoctor protects smallholder farmers with chemical dosage refusal and geo-privacy.
        </p>
        <Link
          href="/safety"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Icons.ShieldCheck className="w-4 h-4" />
          <span>View Safety &amp; Responsible AI Charter</span>
        </Link>
      </div>
    </div>
  );
}
