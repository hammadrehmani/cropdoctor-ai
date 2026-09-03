"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_EXPERT_WHATSAPP_NUMBER || "";

export default function ExpertPage() {
  const [copied, setCopied] = useState(false);

  const handleWhatsAppDirect = () => {
    if (!WHATSAPP_NUMBER) return;
    const text = encodeURIComponent("Assalam-o-Alaikum! I would like to consult an agricultural extension expert regarding a crop leaf issue.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  const handleCopyHelpline = () => {
    navigator.clipboard.writeText("0800-15000");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-800/60 text-xs text-amber-300 font-bold mb-1">
          <Icons.PhoneCall className="w-3.5 h-3.5" />
          <span>Human-in-the-Loop Gate · Extension Support</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-100 tracking-tight">
          Agricultural Expert Consultation
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          When AI confidence is low or complex chemical treatment is needed, AgriGuard connects you directly to verified agricultural extension experts.
        </p>
      </div>

      {/* When to Consult an Expert Cards */}
      <div className="glass p-6 rounded-3xl border-gray-800 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-gray-200 flex items-center gap-2">
          <Icons.ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Safety &amp; Escalation Triggers</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Icons.AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-amber-300">Low AI Confidence</div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              When vision model certainty falls below 60% or leaf symptoms appear ambiguous.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Icons.ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-amber-300">Chemical Dosage</div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              AI models must never prescribe chemical volumes. Only licensed agronomists determine dosages.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Icons.Leaf className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-amber-300">Uncommon Symptoms</div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Novel viral mutations or mixed fungal-bacterial infections requiring laboratory microscopy.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Contact Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* WhatsApp Extension Channel */}
        <div className="glass p-6 rounded-3xl border-emerald-800/60 bg-emerald-950/20 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <Icons.Message className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Direct Chat</span>
            </div>
            <h3 className="text-base font-bold text-emerald-300">Extension WhatsApp Helpline</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Send your crop scan photo and field details directly to a certified extension officer for rapid verification.
            </p>
          </div>

          {WHATSAPP_NUMBER ? (
            <button
              onClick={handleWhatsAppDirect}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Icons.Message className="w-4 h-4" />
              <span>Open WhatsApp Consultation</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] text-gray-400 text-center">
              Direct WhatsApp channel configured via local extension gateway.
            </div>
          )}
        </div>

        {/* National Toll-Free Agro Helpline */}
        <div className="glass p-6 rounded-3xl border-gray-800 space-y-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-emerald-400">
                <Icons.PhoneCall className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Toll-Free Hotline</span>
            </div>
            <h3 className="text-base font-bold text-gray-200">Directorate of Agriculture</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Official government advisory lines for Punjab, Sindh, KPK, and Balochistan agricultural extension departments.
            </p>
          </div>

          <button
            onClick={handleCopyHelpline}
            className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Icons.CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{copied ? "✓ Copied 0800-15000" : "Copy Helpline: 0800-15000"}</span>
          </button>
        </div>
      </div>

      {/* Safety Guideline */}
      <div className="glass p-5 rounded-2xl border-gray-800/80 bg-gray-950/40 text-xs text-gray-400 space-y-1.5">
        <div className="font-bold text-gray-300 flex items-center gap-1.5">
          <Icons.AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Safety Disclaimer</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          AgriGuard AI assists with early detection and explainable triage. Always confirm diagnosis with licensed agronomists or local extension field officers prior to procurement or application of regulated agricultural inputs.
        </p>
      </div>

      {/* Back Actions */}
      <div className="flex justify-center gap-3">
        <Link
          href="/diagnose"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Icons.Camera className="w-4 h-4" />
          <span>Back to Scanner</span>
        </Link>
        <Link
          href="/advisor"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-semibold px-6 py-3 rounded-2xl transition-all cursor-pointer"
        >
          <Icons.Message className="w-4 h-4 text-emerald-400" />
          <span>Ask AI Advisor</span>
        </Link>
      </div>
    </div>
  );
}
