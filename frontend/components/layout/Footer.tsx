import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export function Footer() {
  return (
    <footer
      style={{
        background: "#162e20",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
      className="py-14 text-xs text-white/60 relative z-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: "#244d37" }}
              >
                <Icons.Leaf className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-base font-extrabold text-white">
                <span>CropDoctor</span> <span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-white/60 leading-relaxed text-[11px]">
              AI-Powered Plant Disease &amp; Pest Identification System for Smart Farming: explainable vision triage, automated OpenCV severity quantification, and 7-day meteorological outbreak forecasting.
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-300"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Anonymous · Zero GPS Tracking</span>
            </div>
          </div>

          {/* Core Decision Tools */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Decision Tools
            </div>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link href="/diagnose" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Crop Disease Scanner</span>
                </Link>
              </li>
              <li>
                <Link href="/risk-map" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Map className="w-3.5 h-3.5 text-emerald-400" />
                  <span>District Risk Map</span>
                </Link>
              </li>
              <li>
                <Link href="/advisor" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Message className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Multilingual AI Advisor</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Dashboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Farmer Health Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/crops" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supported Crops &amp; Scope</span>
                </Link>
              </li>
              <li>
                <Link href="/expert" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Extension Expert Escalation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Ethics */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Architecture &amp; Ethics
            </div>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link href="/#what-we-do" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>What We Do</span>
                </Link>
              </li>
              <li>
                <Link href="/technology" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Technical Stack &amp; Models</span>
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Responsible AI &amp; Safety</span>
                </Link>
              </li>
              <li>
                <Link href="/#our-story" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Our Story &amp; Mission</span>
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors inline-flex items-center gap-2">
                  <Icons.HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Frequently Asked Questions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Regional Support */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Pakistan Agricultural Zones
            </div>
            <p className="text-white/60 leading-relaxed text-[11px]">
              Cotton, Wheat, Rice &amp; Sugarcane surveillance across Punjab, Sindh, KPK, and Balochistan.
            </p>
            <div
              className="p-3.5 rounded-2xl space-y-1"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="text-[11px] text-white/60 flex items-center gap-1.5">
                <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Toll-Free Extension Helpline:</span>
              </div>
              <div className="text-emerald-400 font-black text-sm tracking-wide">0800-15000</div>
            </div>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-[11px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            &copy; {new Date().getFullYear()} CropDoctor AI. Smart Farming Made Simple.
          </div>
          <div className="flex items-center gap-3">
            <span>English</span>
            <span>·</span>
            <span>اردو (Urdu)</span>
            <span>·</span>
            <span>سنڌي (Sindhi)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
