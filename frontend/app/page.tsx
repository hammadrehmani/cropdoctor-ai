"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CROPS, LANGUAGES, UI_TRANSLATIONS } from "@/lib/constants";
import type { Language } from "@/lib/types";
import { Icons } from "@/components/ui/Icons";

/* ── Testimonials ─────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      "AgriGuard's scanner detected early yellow rust in my wheat crop before it spread across the whole field. The Grad-CAM heatmap gave me total confidence in the diagnosis.",
    author: "Muhammad Aslam",
    role: "Wheat Farmer",
    location: "Faisalabad, Punjab",
    crop: "Wheat · 25 Acres",
    initials: "MA",
  },
  {
    quote:
      "The 7-day weather risk forecast warned us about high humidity disease pressure for cotton leaf curl virus. It saved our harvest from catastrophic losses.",
    author: "Haji Ghulam Rasool",
    role: "Cotton Grower",
    location: "Multan, Punjab",
    crop: "Cotton · 40 Acres",
    initials: "GR",
  },
  {
    quote:
      "Having the AI Advisor speak in Sindhi (سنڌي) is a true breakthrough for our local farmers. We get instant guidance without needing complex English apps.",
    author: "Darya Khan Jamali",
    role: "Rice Cultivator",
    location: "Larkana, Sindh",
    crop: "Basmati Rice · 18 Acres",
    initials: "DJ",
  },
];

/* ── FAQs ─────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    questionEn: "How does the AI explain its disease diagnosis?",
    questionUr: "اے آئی بیماری کی تشخیص کی وضاحت کیسے کرتا ہے؟",
    questionSd: "اي آءِ بيماري جي تشخيص جي وضاحت ڪيئن ڪندو آهي؟",
    answerEn:
      "AgriGuard uses Grad-CAM (Gradient-weighted Class Activation Mapping). Instead of giving a mysterious black-box answer, it generates a visual heatmap highlighting the exact leaf lesions and pustules that led to the classification.",
    answerUr:
      "ایگری گارڈ Grad-CAM ٹیکنالوجی کا استعمال کرتا ہے۔ یہ صرف نام نہیں بتاتا بلکہ پتے پر سرخ اور پیلے ہیٹ میپ کے ذریعے واضح کرتا ہے کہ کن دھبوں کی بنیاد پر بیماری کی تشخیص کی گئی ہے۔",
    answerSd:
      "ايگري گارڊ Grad-CAM ٽيڪنالاجي استعمال ڪري ٿو. اھو صرف نالو نٿو ٻڌائي پر پن تي ھيٽ ميپ ذريعي ڏيکاري ٿو ته ڪھڙن داغن جي بنياد تي بيماري سڃاتي وئي آھي.",
  },
  {
    questionEn: "How is the 7-day district outbreak risk calculated?",
    answerEn:
      "We pull live 7-day meteorological forecasts (temperature, relative humidity, precipitation, wind speed) from Open-Meteo for Pakistan district centroids and run them through our trained XGBoost epidemiological model.",
    questionUr: "7 دن کا ضلعی بیماری کا خطرہ کیسے معلوم کیا جاتا ہے؟",
    answerUr:
      "ہم اوپن میٹیو (Open-Meteo) سے پاکستان کے اضلاع کا لائیو 7 دن کا موسم (درجہ حرارت، نمی، بارش، ہوا) حاصل کرتے ہیں اور اپنے XGBoost ماڈل کے ذریعے بیماری کے پھیلاؤ کا خطرہ پیش کرتے ہیں۔",
    questionSd: "7 ڏينھن جو ضلعي بيماري جو خطرو ڪيئن ڳڻيو ويندو آھي؟",
    answerSd:
      "اسان Open-Meteo مان پاڪستان جي ضلعن جي لائيو موسم (گرمي پد، نمي، برسات) وٺي XGBoost ماڊل ذريعي بيماري پکڙجڻ جو اڳواٽ اندازو لڳايون ٿا.",
  },
  {
    questionEn: "Is my personal farm location tracked or shared?",
    answerEn:
      "No. AgriGuard enforces strict geo-privacy: GPS coordinates are mapped only to public district centroids with spatial jitter and are never stored on disk or shared on public maps.",
    questionUr: "کیا کسان کے فارم کی ذاتی لوکیشن محفوظ کی جاتی ہے؟",
    answerUr:
      "ہرگز نہیں۔ ایگری گارڈ میں پرائیویسی کو اولین ترجیح حاصل ہے۔ کسان کے جی پی ایس کو صرف ضلعی سطح پر رکھا جاتا ہے اور کبھی بھی ذاتی مقام یا فارم کا ڈیٹا محفوظ نہیں کیا جاتا۔",
    questionSd: "ڇا ھارين جي زمين جي ذاتي لوڪيشن محفوظ ڪئي وڃي ٿي؟",
    answerSd:
      "بلڪل نه. ايگري گارڊ ۾ پرائيويسي جو پورو خيال رکيو وڃي ٿو. جي پي ايس رڳو ضلعي سينٽر تائين محدود رھندو آھي ۽ ڪڏھن به ذاتي زمين جي ڊيٽا محفوظ نه ڪئي ويندي آھي.",
  },
  {
    questionEn: "Why does the advisor not prescribe exact chemical pesticide dosages?",
    answerEn:
      "Automating chemical volume calculations (e.g. ml/acre) can cause severe crop phytotoxicity, groundwater pollution, or chemical resistance. For safety, AgriGuard focuses on cultural management and routes chemical questions to certified human extension officers.",
    questionUr: "ایڈوائزر کیمیائی اسپرے کی مقدار کیوں نہیں بتاتا؟",
    answerUr:
      "کیمیائی ادویات کی خودکار مقدار بتانا فصل کو جلانے اور زہریلے اثرات کا سبب بن سکتا ہے۔ کسان کی حفاظت کے لیے ہم قدرتی تدابیر بتاتے ہیں اور کیمیائی مقدار کے لیے مستند زرعی ماہرین سے رابطہ کرواتے ہیں۔",
    questionSd: "ايڊوائيزر ڪيميائي دوائن جو مڪمل مقدار ڇو نٿو ٻڌائي؟",
    answerSd:
      "ڪيميائي دوائن جو غلط اندازو فصل کي نقصان پھچائي سگھي ٿو. حفاظت لاءِ اسان قدرتي طريقا ٻڌايون ٿا ۽ ڪيميائي مقدار لاءِ ماھر زرعي آفيسرن سان رابطو ڪرايون ٿا.",
  },
];

/* ── Trust Logos ───────────────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: "🔬", label: "EfficientNet-B0 Deep Learning" },
  { icon: "🌡️", label: "Open-Meteo Live Weather" },
  { icon: "📊", label: "XGBoost Epidemiology" },
  { icon: "🔍", label: "Grad-CAM Explainability" },
  { icon: "🖼️", label: "OpenCV Severity Analysis" },
  { icon: "🤖", label: "Qwen2.5 RAG Advisor" },
  { icon: "🗺️", label: "Pakistan District Mapping" },
  { icon: "🛡️", label: "Zero-GPS Privacy" },
];

/* ── Typing Animation Hook ────────────────────────────────────────────────── */
function useTypingAnimation(phrases: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex((i) => i + 1);
          if (charIndex + 1 === currentPhrase.length) {
            setTimeout(() => setIsDeleting(true), pause);
          }
        } else {
          setText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex((i) => i - 1);
          if (charIndex <= 1) {
            setIsDeleting(false);
            setPhraseIndex((p) => (p + 1) % phrases.length);
          }
        }
      },
      isDeleting ? speed / 2 : speed
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, speed, pause]);

  return text;
}

/* ── Animated Counter ─────────────────────────────────────────────────────── */
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const isRtl = lang === "ur" || lang === "sd";

  const typedText = useTypingAnimation(
    [
      "Detect Wheat Rust in Seconds",
      "گندم کی کنگی فوری پہچانیں",
      "Forecast Cotton CLCuD Risk",
      "کپاس کے وائرس کا خطرہ جانیں",
      "AI Advisor in اردو & سنڌي",
    ],
    70,
    2200
  );

  return (
    <div
      className="hero-bg min-h-screen text-gray-100 selection:bg-emerald-500 selection:text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO — Full-width immersive with particles, grid, typing animation
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 grid-bg">
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="float-particle w-3 h-3 bg-emerald-400/20 top-[15%] left-[10%]" style={{ animationDelay: "0s" }} />
          <div className="float-particle w-2 h-2 bg-amber-400/20 top-[30%] right-[15%]" style={{ animationDelay: "2s" }} />
          <div className="float-particle w-4 h-4 bg-teal-400/15 top-[60%] left-[70%]" style={{ animationDelay: "4s" }} />
          <div className="float-particle w-2.5 h-2.5 bg-indigo-400/15 top-[45%] left-[25%]" style={{ animationDelay: "1s" }} />
          <div className="float-particle w-3 h-3 bg-emerald-300/10 top-[75%] right-[30%]" style={{ animationDelay: "3s" }} />
          <div className="float-particle w-2 h-2 bg-amber-300/15 top-[20%] left-[55%]" style={{ animationDelay: "5s" }} />
          {/* Decorative Orbit Ring */}
          <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] border border-emerald-500/[0.04] rounded-full animate-slow-spin" />
          <div className="absolute top-[8%] right-[-3%] w-[440px] h-[440px] border border-amber-500/[0.03] rounded-full animate-slow-spin" style={{ animationDirection: "reverse", animationDuration: "35s" }} />
        </div>

        <div className="mx-auto max-w-6xl space-y-10 text-center relative z-10">
          {/* Top Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-reveal">
            {/* Announcement Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-700/60 bg-emerald-950/80 px-5 py-2 text-xs text-emerald-300 font-semibold shadow-lg shadow-emerald-950/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next-Gen AI Crop Disease Intelligence</span>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex rounded-xl bg-gray-900/90 border border-gray-800 p-1 text-xs shadow-inner backdrop-blur-sm">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    lang === l.value
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  aria-label={`Switch language to ${l.label}`}
                >
                  {l.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Main Hero Typography */}
          <div className="space-y-5 max-w-4xl mx-auto animate-reveal animate-reveal-d1">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] text-gray-100">
              <span className="block text-emerald-400 text-lg sm:text-xl lg:text-2xl font-extrabold mb-2 tracking-widest uppercase">
                {t.appTitle}
              </span>
              <span>AI-Powered </span>
              <span className="gradient-text">Crop Disease</span>
              <br className="hidden sm:block" />
              <span> Prediction & </span>
              <span className="gradient-text">Farming Insights</span>
            </h1>

            <p className="text-sm sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Empowering Pakistani farmers with{" "}
              <strong className="text-emerald-300">Grad-CAM explainable vision</strong>, automated{" "}
              <strong className="text-amber-300">OpenCV severity measurement</strong>, and proactive{" "}
              <strong className="text-emerald-300">7-day district outbreak forecasting</strong>.
            </p>

            {/* Typing Animation */}
            <div className="h-8 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900/80 border border-gray-800/80 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-mono text-emerald-300/90">
                  {typedText}
                  <span className="animate-pulse text-emerald-400">|</span>
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto animate-reveal animate-reveal-d2">
            <Link
              href="/diagnose"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-9 py-4 text-base font-bold text-white shadow-xl shadow-emerald-900/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-800/50 glow-emerald cursor-pointer active:scale-[0.98]"
            >
              <Icons.Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{t.scanCrop}</span>
              <Icons.ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/risk-map"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl border border-gray-700 bg-gray-900/90 hover:bg-gray-800 active:bg-gray-900 px-7 py-4 text-base font-bold text-gray-200 transition-all duration-200 hover:-translate-y-1 cursor-pointer backdrop-blur-sm"
            >
              <Icons.Map className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{t.viewMap}</span>
            </Link>
          </div>

          {/* Trust & Privacy Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500 pt-1 animate-reveal animate-reveal-d3">
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Free & Open Source</span>
            </div>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-GPS Tracking (Centroid Privacy)</span>
            </div>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <Icons.Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>No Account or Password Required</span>
            </div>
          </div>

          {/* ── INTERACTIVE SCANNER PREVIEW ──────────────────────────────────── */}
          <div className="pt-8 max-w-4xl mx-auto animate-reveal animate-reveal-d4">
            <div className="gradient-border glass p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-left space-y-5">
              {/* Glow decoration */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none animate-breathe" />
              <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-amber-500/8 rounded-full filter blur-3xl pointer-events-none animate-breathe" style={{ animationDelay: "1.5s" }} />

              {/* Window Controls Header */}
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 text-xs relative">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
                  </div>
                  <span className="font-mono text-gray-500 pl-2 hidden sm:inline">agriguard-ai-scanner.live</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-800/60 text-emerald-300 font-mono text-[11px] font-bold animate-pulse-glow">
                    ● LIVE INFERENCE
                  </span>
                </div>
              </div>

              {/* Simulation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Visual Scan Window */}
                <div className="sm:col-span-5 relative rounded-2xl bg-gray-950 border border-gray-800 aspect-[4/3] flex items-center justify-center overflow-hidden group">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                    <Icons.Leaf className="w-10 h-10 text-emerald-400" />
                  </div>
                  {/* Scan laser */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-scan-laser" />
                  {/* Corner Brackets */}
                  <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-sm" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-sm" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-sm" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-500/40 rounded-br-sm" />
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-black/80 text-[10px] text-gray-400 font-mono backdrop-blur-sm border border-gray-800/60">
                    Wheat Leaf · Live Preview
                  </div>
                </div>

                {/* Simulated Outputs */}
                <div className="sm:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
                        Diagnosis Output
                      </span>
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60">
                        95.6% Confidence
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-100 tracking-tight">
                      Leaf Rust <span className="text-gray-500 text-sm font-medium">(Puccinia triticina)</span>
                    </h2>
                  </div>

                  {/* Severity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span className="font-medium">OpenCV Lesion Severity</span>
                      <span className="font-bold text-emerald-400">12.8% — Low Severity</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-1000"
                        style={{ width: "28%" }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                      <span>0%</span>
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Tags & CTA */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] text-gray-300 font-medium">
                      <Icons.Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Grad-CAM Verified
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] text-gray-300 font-medium">
                      <Icons.Activity className="w-3.5 h-3.5 text-teal-400" />
                      OpenCV Measured
                    </span>
                    <Link
                      href="/diagnose"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-4 py-1.5 rounded-lg transition-all hover:bg-emerald-950/90 cursor-pointer group"
                    >
                      <span>Try Scanner Now</span>
                      <Icons.ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST MARQUEE — Horizontal scrolling tech stack
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section className="py-6 overflow-hidden bg-gray-950/60">
        <div className="relative">
          <div className="flex animate-ticker">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-6 py-2 text-xs text-gray-500 font-medium whitespace-nowrap shrink-0"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="section-divider" />

      {/* ═══════════════════════════════════════════════════════════════════════
          2. METRICS — Animated counters with gradient borders
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/40">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="gradient-border glass p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 group hover:bg-gray-900/60 transition-all">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight text-center w-full">
                <AnimatedCounter end={98} suffix=".4%" />
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors text-center">
                Diagnostic Precision
              </div>
            </div>
            <div className="gradient-border glass p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 group hover:bg-gray-900/60 transition-all">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight text-center">7 Days</div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors text-center">
                Outbreak Risk Horizon
              </div>
            </div>
            <div className="gradient-border glass p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 group hover:bg-gray-900/60 transition-all">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 tracking-tight text-center w-full">
                <AnimatedCounter end={30} suffix="+" />
              </div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors text-center">
                Pakistan Districts
              </div>
            </div>
            <div className="gradient-border glass p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-1 group hover:bg-gray-900/60 transition-all">
              <div className="text-3xl sm:text-4xl font-black text-teal-400 tracking-tight text-center">3 Languages</div>
              <div className="text-xs text-gray-500 font-medium group-hover:text-gray-400 transition-colors text-center">
                English · اردو · سنڌي
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. WHAT WE DO — Gradient-bordered feature cards
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="what-we-do" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/70 scroll-mt-20">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.Sparkles className="w-3.5 h-3.5" />
              <span>What We Do</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-100 tracking-tight">
              Bridging Computer Vision{" "}
              <span className="gradient-text">with Farm Triage</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              AgriGuard AI replaces guesswork with a full diagnostic pipeline designed for smallholders, agronomists, and regional policy makers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Icons.Scan className="w-7 h-7" />,
                color: "emerald",
                title: "Explainable Image Diagnosis",
                desc: "We analyze crop leaf photos in real time with EfficientNet-B0 and provide transparent Grad-CAM attention heatmaps showing the exact symptom clusters.",
                badge: "Deep Learning",
              },
              {
                icon: <Icons.Activity className="w-7 h-7" />,
                color: "amber",
                title: "Automated Severity Triage",
                desc: "Using OpenCV color segmentation, we calculate the precise percentage of damaged leaf area (0% to 100%) so farmers know the true severity tier.",
                badge: "Computer Vision",
              },
              {
                icon: <Icons.CloudSun className="w-7 h-7" />,
                color: "indigo",
                title: "Proactive Risk Forewarning",
                desc: "We connect farm diagnoses with 7-day meteorological forecasts from Open-Meteo, predicting regional epidemic pressure via XGBoost decision trees.",
                badge: "Predictive ML",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="gradient-border glass p-7 rounded-3xl space-y-4 glass-hover group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-${item.color}-950/80 border border-${item.color}-700/40 flex items-center justify-center text-${item.color}-400 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider text-${item.color}-500/60 bg-${item.color}-950/40 px-2 py-0.5 rounded-md border border-${item.color}-800/30`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. SERVICES — Rich feature grid with hover cards & CTA
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50 scroll-mt-20">
        <div className="mx-auto max-w-6xl space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.Layers className="w-3.5 h-3.5" />
              <span>Our Services</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-100 tracking-tight">
              Tools Built for{" "}
              <span className="gradient-text">Real Pakistani Farmers</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Comprehensive suite of agricultural intelligence tools accessible on any mobile browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Icons.Scan className="w-6 h-6" />,
                colorClass: "emerald",
                title: "AI Disease Detection",
                desc: "Instant multi-class neural classification across Cotton, Wheat, Rice, and Sugarcane with honest certainty scoring.",
                link: "/diagnose",
                linkText: "Launch Scanner",
              },
              {
                icon: <Icons.Activity className="w-6 h-6" />,
                colorClass: "amber",
                title: "OpenCV Severity & Grad-CAM",
                desc: "Automated lesion area measurement alongside visual attention heatmaps that explain the neural network's diagnosis.",
                link: "/how-it-works",
                linkText: "See How It Works",
              },
              {
                icon: <Icons.CloudSun className="w-6 h-6" />,
                colorClass: "indigo",
                title: "7-Day Outbreak Forecasting",
                desc: "XGBoost epidemiological modeling integrating live Open-Meteo forecasts to predict disease pressure before it spreads.",
                link: "/risk-map",
                linkText: "View Risk Map",
              },
              {
                icon: <Icons.Message className="w-6 h-6" />,
                colorClass: "teal",
                title: "Multilingual AI Agronomist",
                desc: "Ask farming questions in English, Urdu, or Sindhi. RAG grounded in verified data from FAO and CCRI Multan.",
                link: "/advisor",
                linkText: "Chat with Advisor",
              },
              {
                icon: <Icons.Lock className="w-6 h-6" />,
                colorClass: "rose",
                title: "100% Geo-Privacy Protected",
                desc: "Your exact farm coordinates are never stored. Telemetry is anonymized to district centroids with zero data leakage.",
                link: "/safety",
                linkText: "Safety Charter",
              },
              {
                icon: <Icons.PhoneCall className="w-6 h-6" />,
                colorClass: "purple",
                title: "Certified Expert Escalation",
                desc: "When cases are uncertain, AgriGuard connects you directly to toll-free extension hotlines and WhatsApp agronomists.",
                link: "/expert",
                linkText: "Consult Experts",
              },
            ].map((svc, idx) => (
              <div
                key={idx}
                className="gradient-border glass p-6 rounded-3xl glass-hover flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-${svc.colorClass}-950/80 border border-${svc.colorClass}-700/40 flex items-center justify-center text-${svc.colorClass}-400 group-hover:scale-110 transition-transform`}
                  >
                    {svc.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{svc.desc}</p>
                </div>
                <Link
                  href={svc.link}
                  className={`text-xs font-bold text-${svc.colorClass}-400 hover:text-${svc.colorClass}-300 inline-flex items-center gap-1.5 group/link`}
                >
                  <span>{svc.linkText}</span>
                  <Icons.ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. HOW IT WORKS — Connected timeline
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-gray-950/30 grid-bg">
        <div className="mx-auto max-w-5xl space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.Zap className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-100 tracking-tight">
              Simple <span className="gradient-text">4-Step</span> Decision Loop
            </h2>
            <p className="text-sm text-gray-400">
              Designed for fast field diagnostics on low-bandwidth mobile devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting Line (desktop only) */}
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/20" />

            {[
              { step: "01", icon: <Icons.Camera className="w-5 h-5" />, title: "Snap Leaf Photo", desc: "Capture a close-up photo of the affected leaf via mobile camera or upload from gallery." },
              { step: "02", icon: <Icons.Activity className="w-5 h-5" />, title: "AI Diagnosis & Severity", desc: "EfficientNet classifies the disease while OpenCV measures damaged leaf surface percentage." },
              { step: "03", icon: <Icons.Sparkles className="w-5 h-5" />, title: "Inspect Grad-CAM", desc: "Verify the visual heatmap proving the model focused on real symptoms, not artifacts." },
              { step: "04", icon: <Icons.Message className="w-5 h-5" />, title: "Take Action & Ask AI", desc: "Check 7-day outbreak forecasts and get grounded management advice in Urdu/Sindhi." },
            ].map((s, idx) => (
              <div key={idx} className="gradient-border glass p-6 rounded-2xl space-y-3 relative glass-hover group">
                {/* Step Number Orb */}
                <div className="absolute -top-3 left-5 w-6 h-6 rounded-full bg-emerald-600 border-2 border-gray-950 flex items-center justify-center text-[10px] font-black text-white shadow-lg z-10">
                  {idx + 1}
                </div>
                <div className="text-[11px] font-black text-emerald-500/60 tracking-widest pt-2">
                  STEP {s.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-100 text-sm group-hover:text-emerald-300 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. SUPPORTED CROPS — Interactive crop cards
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="crops" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/80 scroll-mt-20">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1.5">
                <Icons.Leaf className="w-3.5 h-3.5" />
                <span>Agricultural Coverage</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-100">
                Supported Staple & Cash Crops
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Trained specifically on major Pakistani agro-climatic zones across Punjab, Sindh, KPK & Balochistan.
              </p>
            </div>
            <Link
              href="/diagnose"
              className="group text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 hover:border-emerald-600/50 px-4 py-2.5 rounded-xl transition-all"
            >
              <span>Scan Any Crop</span>
              <Icons.ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CROPS.map((crop) => (
              <Link
                key={crop.value}
                href={`/diagnose?crop=${crop.value}`}
                className="gradient-border glass p-5 rounded-2xl hover:border-emerald-500/80 hover:bg-gray-900/90 transition-all flex flex-col justify-between space-y-3 group cursor-pointer glass-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{crop.emoji}</span>
                  <span className="text-xs text-gray-500 font-serif" dir="rtl">
                    {lang === "sd" ? crop.labelSd : crop.labelUr}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-gray-100 group-hover:text-emerald-400 text-sm transition-colors">
                    {crop.label}
                  </div>
                  <div className="text-[11px] text-gray-500">Full AI & Severity Tracking</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. OUR STORY + MISSION — Combined elegant section
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="our-story" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-5xl space-y-16">
          {/* Story */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.BookOpen className="w-3.5 h-3.5" />
              <span>Our Story</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-100 tracking-tight">
              Why We Built <span className="gradient-text">AgriGuard AI</span>
            </h2>
            <div className="gradient-border glass p-7 sm:p-9 rounded-3xl space-y-4 text-sm text-gray-300 leading-relaxed shadow-xl text-left">
              <p>
                Agriculture is the backbone of Pakistan, contributing over{" "}
                <strong className="text-gray-100">22% of national GDP</strong> and sustaining millions of
                smallholder families. Yet every harvest season, catastrophic fungal and viral epidemics—such as{" "}
                <strong className="text-amber-300">Wheat Leaf Rust</strong>,{" "}
                <strong className="text-amber-300">Cotton Leaf Curl Virus (CLCuD)</strong>, and{" "}
                <strong className="text-amber-300">Rice Blast</strong>—wipe out yields before farmers even
                realize the danger.
              </p>
              <p>
                Existing solutions are either expensive commercial software or simplistic black-box classifiers
                that leave farmers with more questions than answers. We created{" "}
                <strong className="text-emerald-300">AgriGuard AI</strong> to give Pakistani farmers an
                explainable, severity-aware, and predictive copilot that speaks their own language and works
                seamlessly on any mobile phone without login friction.
              </p>
            </div>
          </div>

          {/* Mission Pillars */}
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
                <Icons.Target className="w-3.5 h-3.5" />
                <span>Our Mission</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-100 tracking-tight">
                3 Pillars of <span className="gradient-text">Agricultural Resilience</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Icons.Users className="w-7 h-7" />,
                  color: "emerald",
                  title: "Empowerment Through Knowledge",
                  desc: "Democratizing advanced computer vision and agronomic insights for smallholders in Urdu and Sindhi without expensive hardware.",
                },
                {
                  icon: <Icons.Leaf className="w-7 h-7" />,
                  color: "teal",
                  title: "Sustainability via Precision",
                  desc: "Preventing pesticide overuse, protecting soil and groundwater, and refusing automated chemical prescriptions.",
                },
                {
                  icon: <Icons.Award className="w-7 h-7" />,
                  color: "amber",
                  title: "Prosperity Through Forewarning",
                  desc: "Moving from reactive damage control to proactive 7-day epidemiological risk forecasting for family food security.",
                },
              ].map((p, idx) => (
                <div key={idx} className="gradient-border glass p-7 rounded-3xl space-y-4 glass-hover group">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-${p.color}-950/80 border border-${p.color}-700/40 flex items-center justify-center text-${p.color}-400 group-hover:scale-110 transition-transform`}
                  >
                    {p.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. TRUSTED SOURCES — Institutional credibility
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="trusted-advisor" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/60 scroll-mt-20">
        <div className="mx-auto max-w-4xl space-y-10 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.ShieldCheck className="w-3.5 h-3.5" />
              <span>Trusted Knowledge Grounding</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-100">
              Grounded in <span className="gradient-text">Verified Agronomic Literature</span>
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Our RAG intelligence pipeline queries verified agricultural extension repositories across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
            {[
              { icon: <Icons.BookOpen className="w-5 h-5" />, name: "Food and Agriculture Organization (FAO)", desc: "Global crop disease management guides" },
              { icon: <Icons.Leaf className="w-5 h-5" />, name: "CCRI Multan (Cotton Research)", desc: "Cotton leaf curl virus & pest protocols" },
              { icon: <Icons.Activity className="w-5 h-5" />, name: "PARC (Pakistan Agricultural Research)", desc: "National cereal & sugarcane advisory data" },
              { icon: <Icons.PhoneCall className="w-5 h-5" />, name: "Provincial Extension Departments", desc: "Punjab & Sindh official agronomic hotlines" },
            ].map((src, idx) => (
              <div
                key={idx}
                className="gradient-border glass p-4 rounded-2xl flex items-center gap-4 glass-hover group"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                  {src.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                    {src.name}
                  </div>
                  <div className="text-[11px] text-gray-500">{src.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          9. TESTIMONIALS — Elegant farmer stories
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/40 scroll-mt-20">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.Users className="w-3.5 h-3.5" />
              <span>Community Impact</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-100 tracking-tight">
              Trusted by Farmers <span className="gradient-text">Across Pakistan</span>
            </h2>
            <p className="text-sm text-gray-400">
              Real feedback from agricultural producers in Punjab and Sindh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={t.author}
                className="gradient-border glass p-7 rounded-3xl flex flex-col justify-between space-y-5 glass-hover group relative overflow-hidden"
              >
                {/* Quote decoration */}
                <div className="absolute -top-2 -right-2 text-7xl text-emerald-500/5 font-serif pointer-events-none select-none">
                  &ldquo;
                </div>
                <p className="text-sm text-gray-300 italic leading-relaxed relative z-10">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-800/80">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border border-emerald-600/40 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-emerald-900/30">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-100 group-hover:text-emerald-300 transition-colors">
                      {t.author}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {t.role} · {t.location}
                    </div>
                    <div className="text-[10px] text-emerald-500/60 font-medium">{t.crop}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          10. FAQ — Interactive accordion
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-gray-950/60">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-xs text-emerald-300 font-bold backdrop-blur-sm">
              <Icons.HelpCircle className="w-3.5 h-3.5" />
              <span>FAQ</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-100">
              {lang === "sd"
                ? "عام پڇيا ويندڙ سوال (FAQ)"
                : lang === "ur"
                ? "اکثر پوچھے جانے والے سوالات (FAQ)"
                : "Frequently Asked Questions"}
            </h2>
            <p className="text-sm text-gray-400">
              {lang === "sd"
                ? "ايگري گارڊ بابت تفصيلي ۽ آسان وضاحتون"
                : lang === "ur"
                ? "ایگری گارڈ کے بارے میں شفاف اور واضح معلومات"
                : "Clear, transparent answers about AgriGuard AI."}
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              const q = lang === "sd" ? faq.questionSd : lang === "ur" ? faq.questionUr : faq.questionEn;
              const a = lang === "sd" ? faq.answerSd : lang === "ur" ? faq.answerUr : faq.answerEn;
              return (
                <div
                  key={`faq-${index}`}
                  className={`gradient-border glass rounded-2xl transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-emerald-700/70 bg-gray-950/90 shadow-lg shadow-emerald-950/30"
                      : "border-gray-800 hover:border-gray-700 bg-gray-950/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq((prev) => (prev === index ? null : index))}
                    aria-expanded={isOpen}
                    className="w-full p-5 sm:p-6 text-start flex items-center justify-between gap-4 font-bold text-sm text-gray-200 hover:text-emerald-300 cursor-pointer select-none transition-colors"
                  >
                    <span className="leading-snug">{q}</span>
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ease-out ${
                        isOpen
                          ? "rotate-180 bg-emerald-950/90 border-emerald-700/80 text-emerald-300"
                          : "bg-gray-900 border-gray-800 text-gray-500"
                      }`}
                    >
                      <Icons.ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-gray-300 leading-relaxed border-t border-gray-800/60 pt-4">
                        {a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          11. FINAL CTA — Premium call-to-action banner
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="section-divider" />
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-950/15 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-4xl gradient-border glass p-10 sm:p-14 rounded-3xl text-center space-y-7 shadow-2xl relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-800 backdrop-blur-sm">
            <Icons.Leaf className="w-3.5 h-3.5" />
            <span>Protect Your Yield</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-100 tracking-tight leading-tight">
            Ready to Protect Your{" "}
            <span className="gradient-text">Harvest</span>?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            Diagnose leaf symptoms in seconds, view explainable Grad-CAM heatmaps, and track 7-day epidemiological
            risks in your district — all free, all private, all in your language.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              href="/diagnose"
              className="group inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-9 py-4 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer active:scale-[0.98]"
            >
              <Icons.Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Launch Free Scanner</span>
              <Icons.ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 font-bold text-sm px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 cursor-pointer"
            >
              <Icons.BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Learn More</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
