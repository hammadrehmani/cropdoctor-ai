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
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Top Banner Header — Croplyx deep forest green */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-white">
        <div className="max-w-4xl mx-auto space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-1"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <Icons.PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>Human-in-the-Loop Gate · Extension Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Agricultural Expert Consultation
          </h1>
          <p className="text-xs sm:text-sm text-white/60 max-w-xl leading-relaxed">
            When AI confidence is low or complex chemical treatment is needed, CropDoctor connects you directly to verified agricultural extension experts.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 pb-16 space-y-6">
        {/* When to Consult an Expert Cards */}
        <div className="card-croplyx p-6 sm:p-7 space-y-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3" style={{ borderColor: "#E5E1D8" }}>
            <Icons.ShieldCheck className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span>Safety &amp; Escalation Triggers</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div
              className="p-4 rounded-2xl space-y-2"
              style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-700"
                style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
              >
                <Icons.AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-gray-900">Low AI Confidence</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                When vision model certainty falls below 60% or leaf symptoms appear ambiguous.
              </p>
            </div>

            <div
              className="p-4 rounded-2xl space-y-2"
              style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-700"
                style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
              >
                <Icons.ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-gray-900">Chemical Dosage</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                AI models must never prescribe chemical volumes. Only licensed agronomists determine dosages.
              </p>
            </div>

            <div
              className="p-4 rounded-2xl space-y-2"
              style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-700"
                style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
              >
                <Icons.Leaf className="w-4 h-4" />
              </div>
              <div className="text-xs font-extrabold text-gray-900">Uncommon Symptoms</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Novel viral mutations or mixed fungal-bacterial infections requiring laboratory microscopy.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Contact Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* WhatsApp Extension Channel */}
          <div
            className="card-croplyx p-6 space-y-4 flex flex-col justify-between"
            style={{ background: "#E8F5EE", border: "1px solid #BBF7D0" }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "#16A34A" }}
                >
                  <Icons.Message className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Direct Chat</span>
              </div>
              <h3 className="text-base font-extrabold text-emerald-900">Extension WhatsApp Helpline</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Send your crop scan photo and field details directly to a certified extension officer for rapid verification.
              </p>
            </div>

            {WHATSAPP_NUMBER ? (
              <button
                onClick={handleWhatsAppDirect}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                style={{ background: "#1a3626" }}
              >
                <Icons.Message className="w-4 h-4" />
                <span>Open WhatsApp Consultation</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-white/80 border border-emerald-200 text-[11px] text-emerald-800 text-center font-medium">
                Direct WhatsApp channel configured via local extension gateway.
              </div>
            )}
          </div>

          {/* National Toll-Free Agro Helpline */}
          <div className="card-croplyx p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
                >
                  <Icons.PhoneCall className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Toll-Free Hotline</span>
              </div>
              <h3 className="text-base font-extrabold text-gray-900">Directorate of Agriculture</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Official government advisory lines for Punjab, Sindh, KPK, and Balochistan agricultural extension departments.
              </p>
            </div>

            <button
              onClick={handleCopyHelpline}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
            >
              <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{copied ? "✓ Copied 0800-15000" : "Copy Helpline: 0800-15000"}</span>
            </button>
          </div>
        </div>

        {/* Safety Guideline */}
        <div
          className="p-5 rounded-2xl text-xs space-y-1.5"
          style={{ background: "#FAF8F5", border: "1px solid #E5E1D8", color: "#64748B" }}
        >
          <div className="font-bold text-gray-800 flex items-center gap-1.5">
            <Icons.AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Safety Disclaimer</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            CropDoctor AI assists with early detection and explainable triage. Always confirm diagnosis with licensed agronomists or local extension field officers prior to procurement or application of regulated agricultural inputs.
          </p>
        </div>

        {/* Back Actions */}
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
            style={{ background: "#1a3626" }}
          >
            <Icons.Camera className="w-4 h-4" />
            <span>Back to Scanner</span>
          </Link>
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
            style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
          >
            <Icons.Message className="w-4 h-4" style={{ color: "#16A34A" }} />
            <span>Ask AI Advisor</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
