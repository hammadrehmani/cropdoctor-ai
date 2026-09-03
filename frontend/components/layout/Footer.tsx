import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export function Footer() {
  return (
    <footer className="border-t border-gray-800/80 bg-gray-950/95 py-12 text-xs text-gray-400 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/90 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
                <Icons.Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-base font-extrabold text-gray-100">
                <span className="text-emerald-400">CropDoctor</span> AI
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              AI-Powered Plant Disease &amp; Pest Identification System for Smart Farming: explainable vision triage, automated OpenCV severity quantification, and 7-day meteorological outbreak forecasting.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-300 font-semibold">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Anonymous · Zero GPS Tracking</span>
            </div>
          </div>

          {/* Core Decision Tools */}
          <div className="space-y-2.5">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              Decision Tools
            </div>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/diagnose" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Camera className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Crop Disease Scanner</span>
                </Link>
              </li>
              <li>
                <Link href="/risk-map" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Map className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>District Risk Map</span>
                </Link>
              </li>
              <li>
                <Link href="/advisor" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Message className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Multilingual AI Advisor</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Dashboard className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Farmer Health Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/crops" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Leaf className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Supported Crops &amp; Scope</span>
                </Link>
              </li>
              <li>
                <Link href="/expert" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Extension Expert Escalation</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Ethics */}
          <div className="space-y-2.5">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              Architecture &amp; Ethics
            </div>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/how-it-works" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Zap className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>How It Works (Pipeline)</span>
                </Link>
              </li>
              <li>
                <Link href="/technology" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Layers className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Technical Stack &amp; Models</span>
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Responsible AI &amp; Safety Charter</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.BookOpen className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Mission &amp; Impact</span>
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                  <Icons.Award className="w-3.5 h-3.5 text-emerald-400/80" />
                  <span>Hackathon Evaluation Guide</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Regional Support */}
          <div className="space-y-2.5">
            <div className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              Pakistan Agricultural Zones
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Cotton, Wheat, Rice &amp; Sugarcane surveillance across Punjab, Sindh, KPK, and Balochistan.
            </p>
            <div className="p-3 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-1">
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Icons.PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Toll-Free Extension Helpline:</span>
              </div>
              <div className="text-emerald-400 font-black text-sm tracking-wide">0800-15000</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} CropDoctor AI. AI-Powered Plant Disease &amp; Pest Identification System for Smart Farming.
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
