"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CROPS, LANGUAGES, UI_TRANSLATIONS } from "@/lib/constants";
import type { Language } from "@/lib/types";
import { Icons } from "@/components/ui/Icons";

/* ── FAQs ─────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    questionEn: "How does the AI explain its disease diagnosis?",
    questionUr: "اے آئی بیماری کی تشخیص کی وضاحت کیسے کرتا ہے؟",
    questionSd: "اي آءِ بيماري جي تشخيص جي وضاحت ڪيئن ڪندو آهي؟",
    answerEn:
      "CropDoctor AI uses Grad-CAM (Gradient-weighted Class Activation Mapping). Instead of giving a mysterious black-box answer, it generates a visual heatmap highlighting the exact leaf lesions and pustules that led to the classification.",
    answerUr:
      "کراپ ڈاکٹر AI جدید Grad-CAM ٹیکنالوجی کا استعمال کرتا ہے۔ یہ صرف نام نہیں بتاتا بلکہ پتے پر سرخ اور پیلے ہیٹ میپ کے ذریعے واضح کرتا ہے کہ کن دھبوں کی بنیاد پر بیماری یا کیڑوں کی تشخیص کی گئی ہے۔",
    answerSd:
      "ڪراپ ڊاڪٽر AI جديد Grad-CAM ٽيڪنالاجي استعمال ڪري ٿو. اھو صرف نالو نٿو ٻڌائي پر پن تي ھيٽ ميپ ذريعي ڏيکاري ٿو ته ڪھڙن داغن جي بنياد تي بيماري سڃاتي وئي آھي.",
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
      "No. CropDoctor AI enforces strict geo-privacy: GPS coordinates are mapped only to public district centroids with spatial jitter and are never stored on disk or shared on public maps.",
    questionUr: "کیا کسان کے فارم کی ذاتی لوکیشن محفوظ کی جاتی ہے؟",
    answerUr:
      "ہرگز نہیں۔ کراپ ڈاکٹر AI میں پرائیویسی کو اولین ترجیح حاصل ہے۔ کسان کے جی پی ایس کو صرف ضلعی سطح پر رکھا جاتا ہے اور کبھی بھی ذاتی مقام یا فارم کا ڈیٹا محفوظ نہیں کیا جاتا۔",
    questionSd: "ڇا ھارين جي زمين جي ذاتي لوڪيشن محفوظ ڪئي وڃي ٿي؟",
    answerSd:
      "بلڪل نه. ڪراپ ڊاڪٽر AI ۾ پرائيويسي جو پورو خيال رکيو وڃي ٿو. جي پي ايس رڳو ضلعي سينٽر تائين محدود رھندو آھي ۽ ڪڏھن به ذاتي زمين جي ڊيٽا محفوظ نه ڪئي ويندي آھي.",
  },
  {
    questionEn: "Why does the advisor not prescribe exact chemical pesticide dosages?",
    answerEn:
      "Automating chemical volume calculations (e.g. ml/acre) can cause severe crop phytotoxicity, groundwater pollution, or chemical resistance. For safety, CropDoctor AI focuses on cultural management and routes chemical questions to certified human extension officers.",
    questionUr: "ایڈوائزر کیمیائی اسپرے کی مقدار کیوں نہیں بتاتا؟",
    answerUr:
      "کیمیائی ادویات کی خودکار مقدار بتانا فصل کو جلانے اور زہریلے اثرات کا سبب بن سکتا ہے۔ کسان کی حفاظت کے لیے ہم قدرتی تدابیر بتاتے ہیں اور کیمیائی مقدار کے لیے مستند زرعی ماہرین سے رابطہ کرواتے ہیں۔",
    questionSd: "ايڊوائيزر ڪيميائي دوائن جو مڪمل مقدار ڇو نٿو ٻڌائي؟",
    answerSd:
      "ڪيميائي دوائن جو غلط اندازو فصل کي نقصان پھچائي سگھي ٿو. حفاظت لاءِ اسان قدرتي طريقا ٻڌايون ٿا ۽ ڪيميائي مقدار لاءِ ماھر زرعي آفيسرن سان رابطو ڪرايون ٿا.",
  },
];

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

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS.en;
  const isRtl = lang === "ur" || lang === "sd";

  return (
    <div className="text-gray-900" dir={isRtl ? "rtl" : "ltr"}>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO — Croplyx-style dark forest green hero
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="hero-croplyx min-h-screen flex items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating ambient glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(74,154,107,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(233,168,0,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />

        <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24 lg:py-32 relative z-10">

          {/* Left: Text Content */}
          <div className="space-y-8 animate-reveal">
            {/* Badge + Language Switcher */}
            <div className="flex flex-wrap items-center gap-3 animate-reveal">
              <div className="section-label-dark">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Smart Farming Made Simple
              </div>
              <div className="flex rounded-full bg-white/10 border border-white/15 p-1 text-xs gap-1">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value)}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer text-xs ${
                      lang === l.value
                        ? "bg-white text-gray-900 shadow"
                        : "text-white/70 hover:text-white"
                    }`}
                    aria-label={`Switch to ${l.label}`}
                  >
                    {l.nativeLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 animate-reveal animate-reveal-d1">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05]">
                Grow Better with{" "}
                <span style={{ color: "#4a9a6b" }}>Smart</span>{" "}
                Insights
              </h1>
              <p className="text-lg text-white/65 max-w-lg leading-relaxed font-medium">
                Real-time AI crop disease detection, Grad-CAM explainability, 7-day outbreak forecasting, and multilingual farming advice — all in one platform designed for Pakistani farmers.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-reveal animate-reveal-d2">
              <Link href="/diagnose" className="btn-gold">
                <Icons.Camera className="w-5 h-5" />
                <span>Scan My Crop</span>
                <Icons.ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/advisor" className="btn-outline-white">
                <Icons.Message className="w-5 h-5" />
                <span>AI Advisor</span>
              </Link>
            </div>

            {/* Social Proof Ribbon */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/50 animate-reveal animate-reveal-d3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span><strong className="text-white/80">Thousands</strong> of analyses done</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#E9A800" }} />
                <span><strong className="text-white/80">98.4%</strong> accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Lock className="w-3.5 h-3.5 text-green-400" />
                <span>Zero-GPS Privacy</span>
              </div>
            </div>
          </div>

          {/* Right: Floating Dashboard Card (Croplyx-style) */}
          <div className="relative animate-reveal animate-reveal-d2 animate-float hidden lg:block">
            {/* Main card */}
            <div className="hero-card p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-500">Crop Scanner</div>
                  <div className="text-base font-bold text-gray-900">Today&rsquo;s Field Report</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#16A34A" }}>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Crop Health Score */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#F6FDF8", border: "1px solid #D1FAE5" }}>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">CROP HEALTH</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900">95.6%</span>
                  <span className="text-sm font-semibold text-green-600">Leaf Rust Detected</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: "27%" }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Confidence</span>
                  <span className="font-bold text-gray-700">95.6%</span>
                </div>
              </div>

              {/* Scan Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Analyses", value: "1,200+" },
                  { label: "Accuracy", value: "98.4%", highlight: true },
                  { label: "Response", value: "<2s" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: stat.highlight ? "#1a3626" : "#F4F1E8",
                      color: stat.highlight ? "#fff" : "#374151",
                    }}
                  >
                    <div className="text-sm font-bold">{stat.value}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Scan laser animation on a leaf icon */}
              <div className="relative rounded-xl overflow-hidden h-10 flex items-center justify-center" style={{ background: "#F4F1E8" }}>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <Icons.Leaf className="w-4 h-4 text-green-600" />
                  <span>AI Advisor · Ready to help</span>
                </div>
              </div>
            </div>

            {/* Floating Status Badge */}
            <div className="absolute -top-4 -left-4 hero-card px-4 py-2.5 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="text-lg">🌿</span>
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div className="font-bold text-green-600">Healthy</div>
              </div>
            </div>

            {/* Floating Price Alert Badge */}
            <div className="absolute -bottom-4 -right-4 hero-card px-4 py-2.5 flex items-center gap-2 text-sm font-bold" style={{ color: "#1a3626" }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#1a3626" }}>
                <Icons.Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Risk Map</div>
                <div className="font-bold" style={{ color: "#E9A800" }}>Low Risk</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST MARQUEE — Horizontal scrolling tech stack
          ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "#F0EDE5", borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8" }}>
        <div className="py-4 overflow-hidden relative">
          <div className="flex animate-ticker">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-8 py-1.5 whitespace-nowrap shrink-0"
                style={{ color: "#6B7280", fontSize: "13px", fontWeight: 600 }}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                <span className="mx-4" style={{ color: "#D1CEC8" }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. METRICS — Light cream section with stat cards
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section-light py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: <AnimatedCounter end={98} suffix=".4%" />, label: "Diagnostic Precision", color: "#1a3626" },
              { value: "7 Days", label: "Outbreak Risk Horizon", color: "#1a3626" },
              { value: <AnimatedCounter end={30} suffix="+" />, label: "Pakistan Districts", color: "#1a3626" },
              { value: "3 Lang.", label: "English · اردو · سنڌي", color: "#1a3626" },
            ].map((stat, idx) => (
              <div key={idx} className="card-croplyx p-6 flex flex-col items-center text-center space-y-2">
                <div className="text-3xl sm:text-4xl font-black" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. SERVICES — Croplyx "Tools built for real farmers" style (light bg)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="what-we-do" className="section-light py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20" style={{ background: "#F0EDE5" }}>
        <div className="mx-auto max-w-6xl space-y-14">
          {/* Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <div className="space-y-4">
              <span className="section-label">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                Our Services
              </span>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight" style={{ color: "#1a1a1a" }}>
                Tools built for{" "}
                <span style={{ color: "#4a9a6b" }}>real farmers</span>,
                <br />designed for{" "}
                <span style={{ color: "#4a9a6b" }}>real fields.</span>
              </h2>
            </div>
            <p className="text-base text-gray-500 leading-relaxed max-w-sm">
              Simple, helpful tools to make better farming decisions and protect your harvest with AI-powered confidence.
            </p>
          </div>

          {/* Service Cards — White on cream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Icons.Scan className="w-6 h-6" />,
                iconBg: "#E8F5EE",
                iconColor: "#16A34A",
                title: "AI Disease Detection",
                desc: "Instant multi-class neural classification for Cotton, Wheat, Rice, and Sugarcane with confidence scoring and honest uncertainty reporting.",
                link: "/diagnose",
                linkText: "Launch Scanner",
                tag: "Active",
                features: ["Real-time inference", "EfficientNet-B0 model", "Multi-crop support"],
              },
              {
                icon: <Icons.Activity className="w-6 h-6" />,
                iconBg: "#FEF9E7",
                iconColor: "#E9A800",
                title: "OpenCV Severity & Grad-CAM",
                desc: "Automated lesion area measurement alongside visual attention heatmaps that explain exactly what the neural network is seeing on your leaf.",
                link: "/how-it-works",
                linkText: "See How It Works",
                tag: "Active",
                features: ["Grad-CAM heatmaps", "Lesion % measurement", "Explainable AI"],
              },
              {
                icon: <Icons.CloudSun className="w-6 h-6" />,
                iconBg: "#EEF2FF",
                iconColor: "#6366F1",
                title: "7-Day Outbreak Forecasting",
                desc: "XGBoost epidemiological modeling integrating live Open-Meteo forecasts to predict disease pressure before it spreads through your district.",
                link: "/risk-map",
                linkText: "View Risk Map",
                tag: "Active",
                features: ["Live weather data", "XGBoost risk model", "District-level maps"],
              },
              {
                icon: <Icons.Message className="w-6 h-6" />,
                iconBg: "#F0FDF4",
                iconColor: "#16A34A",
                title: "Multilingual AI Agronomist",
                desc: "Ask farming questions in English, Urdu, or Sindhi. Our RAG-powered advisor is grounded in FAO and CCRI Multan verified data.",
                link: "/advisor",
                linkText: "Chat with Advisor",
                tag: "Active",
                features: ["English, اردو, سنڌي", "RAG grounded", "Expert escalation"],
              },
            ].map((svc, idx) => (
              <div key={idx} className="card-croplyx p-7 space-y-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: svc.iconBg, color: svc.iconColor }}
                  >
                    {svc.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: "#E8F5EE", color: "#16A34A" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {svc.tag}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{svc.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
                </div>
                <ul className="space-y-1.5">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <Icons.CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#4a9a6b" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={svc.link}
                  className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors group"
                  style={{ color: "#4a9a6b" }}
                >
                  {svc.linkText}
                  <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. DISEASE RISK PREDICTION — Dark section (Croplyx premium dark card)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section-light px-4 sm:px-6 lg:px-8 py-10" style={{ background: "#F0EDE5" }}>
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl p-10 sm:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center" style={{ background: "#1a3626" }}>
            {/* Left */}
            <div className="space-y-7">
              <span className="section-label-dark">
                <Icons.ShieldCheck className="w-3.5 h-3.5" />
                Premium Service
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                Disease Risk{" "}
                <span style={{ color: "#4a9a6b" }}>Prediction.</span>
              </h2>
              <p className="text-white/60 text-base leading-relaxed max-w-sm">
                Our smart crop disease prediction uses environmental data analysis to forecast disease and pest risks early, protecting your harvest and improving your yields.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Icons.Zap className="w-4 h-4" />, label: "Early risk prediction" },
                  { icon: <Icons.Sparkles className="w-4 h-4" />, label: "Detailed recommendations" },
                  { icon: <Icons.Leaf className="w-4 h-4" />, label: "Environmental analysis" },
                  { icon: <Icons.ShieldCheck className="w-4 h-4" />, label: "Fast results" },
                ].map((f) => (
                  <div key={f.label} className="feature-tag-dark">
                    {f.icon}
                    {f.label}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Link href="/diagnose" className="btn-gold">Try Free Demo <Icons.ArrowRight className="w-4 h-4" /></Link>
                <Link href="/risk-map" className="btn-outline-white">View Risk Map</Link>
              </div>
            </div>

            {/* Right: Floating Result Card */}
            <div className="flex justify-center">
              <div className="hero-card p-6 w-full max-w-sm space-y-5">
                <div className="flex items-center justify-between text-sm font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Icons.Scan className="w-5 h-5 text-green-600" />
                    <span>Crop Scanner</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-green-600 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                </div>

                <div className="rounded-xl p-4 space-y-3" style={{ background: "#F4F1E8" }}>
                  <div className="flex items-center gap-2">
                    <Icons.Leaf className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DETECTED</div>
                      <div className="font-bold text-gray-900">Leaf Blight</div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: "94.7%" }} />
                  </div>
                  <div className="text-xs text-right font-bold text-gray-500">94.7%</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "1,200+", l: "Analyses" },
                    { v: "98%", l: "Accuracy", dark: true },
                    { v: "<2s", l: "Response" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="rounded-xl p-3 text-center"
                      style={{ background: s.dark ? "#1a3626" : "#F4F1E8", color: s.dark ? "#fff" : "#374151" }}
                    >
                      <div className="font-bold text-sm">{s.v}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. HOW IT WORKS — White section with numbered steps
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section-white py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-5xl space-y-14">
          <div className="text-center space-y-4">
            <span className="section-label">
              <Icons.Zap className="w-3.5 h-3.5" />
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
              Simple <span style={{ color: "#4a9a6b" }}>4-Step</span> Decision Loop
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Designed for fast field diagnostics on low-bandwidth mobile devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-px" style={{ background: "linear-gradient(90deg, transparent, #D1FAE5, transparent)" }} />

            {[
              { step: "01", icon: <Icons.Camera className="w-5 h-5" />, title: "Snap Leaf Photo", desc: "Capture a close-up of the affected leaf via mobile camera or upload from gallery." },
              { step: "02", icon: <Icons.Activity className="w-5 h-5" />, title: "AI Diagnosis & Severity", desc: "EfficientNet classifies the disease while OpenCV measures damaged leaf surface percentage." },
              { step: "03", icon: <Icons.Sparkles className="w-5 h-5" />, title: "Inspect Grad-CAM", desc: "Verify the visual heatmap proving the model focused on real symptoms, not artifacts." },
              { step: "04", icon: <Icons.Message className="w-5 h-5" />, title: "Take Action & Ask AI", desc: "Check 7-day outbreak forecasts and get grounded management advice in Urdu or Sindhi." },
            ].map((s, idx) => (
              <div key={idx} className="card-croplyx p-6 space-y-4 relative">
                <div className="absolute -top-3 left-5 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shadow" style={{ background: "#1a3626" }}>
                  {idx + 1}
                </div>
                <div className="text-[10px] font-black tracking-widest pt-3" style={{ color: "#4a9a6b" }}>
                  STEP {s.step}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5EE", color: "#16A34A" }}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. SUPPORTED CROPS — Light cream section
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="crops" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20" style={{ background: "#F0EDE5" }}>
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="section-label">
                <Icons.Leaf className="w-3.5 h-3.5" />
                Agricultural Coverage
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                Supported Crops
              </h2>
              <p className="text-sm text-gray-500">
                Trained on major Pakistani agro-climatic zones — Punjab, Sindh, KPK & Balochistan.
              </p>
            </div>
            <Link
              href="/diagnose"
              className="btn-dark text-sm"
            >
              Scan Any Crop
              <Icons.ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CROPS.map((crop) => (
              <Link
                key={crop.value}
                href={`/diagnose?crop=${crop.value}`}
                className="card-croplyx p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{crop.emoji}</span>
                  <span className="text-xs text-gray-400 font-serif" dir="rtl">
                    {lang === "sd" ? crop.labelSd : crop.labelUr}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                    {crop.label}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Full AI & Severity Tracking</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. OUR STORY — White section
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="our-story" className="section-white py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-6">
            <span className="section-label">
              <Icons.BookOpen className="w-3.5 h-3.5" />
              Our Story
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
              Why We Built{" "}
              <span style={{ color: "#4a9a6b" }}>CropDoctor AI</span>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Agriculture contributes over <strong>22% of Pakistan&apos;s national GDP</strong> and sustains millions of smallholder families. Yet every harvest season, fungal and viral epidemics — Wheat Leaf Rust, Cotton CLCuD, Rice Blast — wipe out yields before farmers realize the danger.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We created CropDoctor AI to give Pakistani farmers an explainable, severity-aware, and predictive copilot that speaks their own language and works seamlessly on any mobile phone without login friction.
            </p>
            <Link href="/about" className="btn-dark inline-flex">
              Learn More <Icons.ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mission Pillars */}
          <div className="space-y-4">
            {[
              {
                icon: <Icons.Users className="w-5 h-5" />,
                color: "#E8F5EE",
                iconColor: "#16A34A",
                title: "Empowerment Through Knowledge",
                desc: "Democratizing advanced computer vision for smallholders in Urdu and Sindhi without expensive hardware.",
              },
              {
                icon: <Icons.Leaf className="w-5 h-5" />,
                color: "#F0FDF4",
                iconColor: "#16A34A",
                title: "Sustainability via Precision",
                desc: "Preventing pesticide overuse, protecting soil and groundwater, and refusing automated chemical prescriptions.",
              },
              {
                icon: <Icons.Award className="w-5 h-5" />,
                color: "#FEF9E7",
                iconColor: "#E9A800",
                title: "Prosperity Through Forewarning",
                desc: "Moving from reactive damage control to proactive 7-day epidemiological risk forecasting.",
              },
            ].map((p, idx) => (
              <div key={idx} className="card-croplyx p-5 flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: p.color, color: p.iconColor }}
                >
                  {p.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{p.title}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          8. TRUSTED SOURCES — Cream section
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="trusted-advisor" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20" style={{ background: "#F0EDE5" }}>
        <div className="mx-auto max-w-4xl space-y-10 text-center">
          <div className="space-y-4">
            <span className="section-label">
              <Icons.ShieldCheck className="w-3.5 h-3.5" />
              Trusted Knowledge Grounding
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Grounded in <span style={{ color: "#4a9a6b" }}>Verified Agronomic Literature</span>
            </h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
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
              <div key={idx} className="card-croplyx p-4 flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#E8F5EE", color: "#16A34A" }}
                >
                  {src.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{src.name}</div>
                  <div className="text-xs text-gray-500">{src.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          9. FAQ — White section with accordion
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="section-white py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-4">
            <span className="section-label">
              <Icons.HelpCircle className="w-3.5 h-3.5" />
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              {lang === "sd"
                ? "عام پڇيا ويندڙ سوال"
                : lang === "ur"
                ? "اکثر پوچھے جانے والے سوالات"
                : "Frequently Asked Questions"}
            </h2>
            <p className="text-sm text-gray-500">
              {lang === "sd"
                ? "ڪراپ ڊاڪٽر بابت تفصيلي ۽ آسان وضاحتون"
                : lang === "ur"
                ? "کراپ ڈاکٹر AI کے بارے میں شفاف اور واضح معلومات"
                : "Clear, transparent answers about CropDoctor AI."}
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
                  className="card-croplyx transition-all duration-300 overflow-hidden"
                  style={{ boxShadow: isOpen ? "0 4px 20px rgba(26,54,38,0.1)" : undefined, borderColor: isOpen ? "#BBF7D0" : undefined }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq((prev) => (prev === index ? null : index))}
                    aria-expanded={isOpen}
                    className="w-full p-5 sm:p-6 text-start flex items-center justify-between gap-4 font-bold text-sm text-gray-900 hover:text-green-700 cursor-pointer select-none transition-colors"
                  >
                    <span className="leading-snug">{q}</span>
                    <div
                      className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: isOpen ? "#1a3626" : "#F4F1E8",
                        borderColor: isOpen ? "#1a3626" : "#E5E1D8",
                        color: isOpen ? "#fff" : "#6B7280",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
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
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
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
          10. FINAL CTA — Croplyx-style dark banner
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ background: "#1a3626" }}>
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-3xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Icons.Leaf className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Grow smarter, season after season</div>
                <div className="text-sm text-white/50">Join thousands of farmers using CropDoctor AI to predict disease risk before it spreads.</div>
              </div>
            </div>
            <Link href="/diagnose" className="btn-gold shrink-0">
              Try a free prediction
              <Icons.ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER — Dark green footer (Croplyx style)
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="px-4 sm:px-6 lg:px-8 pt-16 pb-10" style={{ background: "#152d20" }}>
        <div className="mx-auto max-w-6xl">
          {/* Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b border-white/10">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#4a9a6b" }}>
                  <Icons.Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-black text-white">CropDoctor AI</div>
                  <div className="text-xs text-white/40">Smart Farming</div>
                </div>
              </div>
              <p className="text-sm text-white/50 max-w-xs leading-relaxed">
                Empowering farmers with AI-powered crop disease prediction, Grad-CAM explainability, and multilingual farming advice.
              </p>
            </div>

            {/* Links */}
            {[
              { title: "PRODUCT", links: [{ l: "Disease Scanner", h: "/diagnose" }, { l: "AI Advisor", h: "/advisor" }, { l: "Risk Map", h: "/risk-map" }, { l: "How It Works", h: "/how-it-works" }] },
              { title: "COMPANY", links: [{ l: "About Us", h: "/about" }, { l: "Safety Charter", h: "/safety" }, { l: "Technology", h: "/technology" }] },
              { title: "SUPPORT", links: [{ l: "Expert Consultation", h: "/expert" }, { l: "Dashboard", h: "/dashboard" }] },
            ].map((col) => (
              <div key={col.title} className="space-y-4">
                <div className="text-xs font-bold tracking-wider" style={{ color: "#4a9a6b" }}>{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.l}>
                      <Link href={link.h} className="text-sm text-white/50 hover:text-white/90 transition-colors">
                        {link.l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-white/30">
              © {new Date().getFullYear()} CropDoctor AI. MIT License.
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#4a9a6b" }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              All systems healthy
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
