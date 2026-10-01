import type { Metadata } from "next";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Responsible AI & Safety — CropDoctor AI",
  description: "Learn about the strict safety guardrails of CropDoctor AI: zero chemical dosage synthesis, low-confidence expert escalation, and geo-privacy protection.",
};

const SAFETY_PILLARS = [
  {
    icon: Icons.ShieldCheck,
    title: "1. Zero Chemical Dosage Generation",
    description:
      "CropDoctor intentionally and strictly refuses to calculate or synthesize specific chemical pesticide volumes (e.g. ml/acre or grams/liter). Automated dosage recommendations can cause severe crop phytotoxicity, environmental contamination, or pathogen resistance. Chemical inquiries are immediately intercepted and referred to certified agronomists.",
  },
  {
    icon: Icons.AlertTriangle,
    title: "2. Uncertainty & Low-Confidence Gating",
    description:
      "When vision model confidence falls below 60% or when symptom visual features appear ambiguous, CropDoctor labels the diagnosis as 'Uncertain Assessment' with a prominent amber alert and disables automated recommendations, providing direct one-click escalation to human extension officers.",
  },
  {
    icon: Icons.Lock,
    title: "3. Geo-Privacy Centroid Protection",
    description:
      "Smallholder farmer private property and field locations are strictly protected. Raw GPS coordinates accepted by the client are immediately mapped to public district centroids with spatial jitter. No private GPS coordinates or farm boundary telemetry are ever stored in databases or broadcast on maps.",
  },
  {
    icon: Icons.Users,
    title: "4. Anonymous Device-Level Isolation",
    description:
      "Smallholders are not forced to register accounts, passwords, or personal identity documents. Diagnosis history is isolated securely per device using client-side anonymous UUIDs (device_id), preventing data exposure across farmers.",
  },
  {
    icon: Icons.BookOpen,
    title: "5. Grounded Institutional Knowledge",
    description:
      "Our RAG knowledge base is curated exclusively from verified institutional literature (FAO, Central Cotton Research Institute Multan, and Provincial Agriculture Extension Departments). If retrieval similarity is low (<0.35), the advisor gracefully declines rather than hallucinating agronomic advice.",
  },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold mb-1">
          <Icons.ShieldCheck className="w-3.5 h-3.5" />
          <span>Agronomic Governance · Responsible AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
          Responsible AI &amp; Safety Charter
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed">
          How CropDoctor AI prioritizes farmer safety, agronomic ethics, transparent explainability, and data privacy over unconstrained automation.
        </p>
      </div>

      {/* Safety Pillars */}
      <div className="space-y-4">
        {SAFETY_PILLARS.map((pillar) => {
          const PillarIcon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="glass p-6 sm:p-7 rounded-3xl border-gray-800 space-y-2 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <PillarIcon className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-100">{pillar.title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pl-0 sm:pl-11">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Extension Support Callout */}
      <div className="glass p-6 sm:p-8 rounded-3xl border-amber-800/60 bg-amber-950/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-900/80 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
            <Icons.PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-200">Human-in-the-Loop Architecture</h2>
            <p className="text-xs text-amber-300/80">AI is a field assistant; human agronomists are the authority.</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          Whenever complex cases arise, CropDoctor bridges farmers directly with official extension channels and toll-free advisory hotlines (<code className="text-amber-300">0800-15000</code>).
        </p>
        <div className="pt-2">
          <Link
            href="/expert"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Icons.PhoneCall className="w-4 h-4" />
            <span>Visit Expert Consultation Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
