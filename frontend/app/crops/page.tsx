"use client";

import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

interface CropDetail {
  id: string;
  nameEn: string;
  nameUr: string;
  scientificName: string;
  season: string;
  seasonUr: string;
  zones: string[];
  diagnosticStatus: "Verified EfficientNet-B0" | "In Pipeline";
  statusColor: string;
  description: string;
  diseases: {
    name: string;
    nameUr: string;
    pathogen: string;
    symptoms: string;
    favorableWeather: string;
    status: string;
  }[];
  culturalTips: string[];
}

const SUPPORTED_CROPS: CropDetail[] = [
  {
    id: "wheat",
    nameEn: "Wheat",
    nameUr: "گندم",
    scientificName: "Triticum aestivum",
    season: "Rabi (Nov – April)",
    seasonUr: "ربیع (نومبر تا اپریل)",
    zones: ["Faisalabad", "Multan", "Bahawalpur", "Sargodha", "Hyderabad", "Sukkur"],
    diagnosticStatus: "Verified EfficientNet-B0",
    statusColor: "bg-emerald-50 border-emerald-200 text-emerald-800",
    description: "Pakistan's primary staple cereal crop. Monitored for foliar rusts and powdery mildew outbreaks driven by cool-humid spring weather.",
    diseases: [
      {
        name: "Leaf Rust (Brown Rust)",
        nameUr: "پتوں کی بھوری کنگی",
        pathogen: "Puccinia triticina",
        symptoms: "Small, circular orange-brown pustules scattered randomly on the upper leaf surface.",
        favorableWeather: "15°C–25°C with dew or >80% relative humidity.",
        status: "Active ML Detection (98% benchmark)",
      },
      {
        name: "Powdery Mildew",
        nameUr: "سفوفی پھپھوندی (پاؤڈری ملڈیو)",
        pathogen: "Blumeria graminis f. sp. tritici",
        symptoms: "White fluffy fungal patches on lower leaf sheaths, turning dull grey/brown as plants mature.",
        favorableWeather: "15°C–22°C with high humidity and dense canopies.",
        status: "Active ML Detection",
      },
      {
        name: "Yellow / Stripe Rust",
        nameUr: "زرد کنگی",
        pathogen: "Puccinia striiformis",
        symptoms: "Narrow stripes of bright yellow pustules arranged linearly between leaf veins.",
        favorableWeather: "10°C–18°C during cool foggy Northern/Central Punjab spells.",
        status: "Target Extension Scope",
      },
    ],
    culturalTips: [
      "Use certified rust-resistant seed varieties recommended by PARC/AARI.",
      "Avoid excess nitrogen fertilizer which creates dense humid foliage.",
      "Scout early during late January and February foggy mornings.",
    ],
  },
  {
    id: "cotton",
    nameEn: "Cotton",
    nameUr: "کپاس",
    scientificName: "Gossypium hirsutum",
    season: "Kharif (May – Nov)",
    seasonUr: "خریف (مئی تا نومبر)",
    zones: ["Khanewal", "Vehari", "Rahim Yar Khan", "Bahawalpur", "Sanghar", "Sukkur"],
    diagnosticStatus: "In Pipeline",
    statusColor: "bg-amber-50 border-amber-200 text-amber-800",
    description: "The silver fiber cornerstone of Pakistan's textile industry. Surveillance focuses on virus transmission vectors and bacterial blights.",
    diseases: [
      {
        name: "Cotton Leaf Curl Disease (CLCuD)",
        nameUr: "پتہ مروڑ وائرس (سی ایل سی یو ڈی)",
        pathogen: "Begomovirus transmitted by Whitefly (Bemisia tabaci)",
        symptoms: "Upward or downward leaf curling, vein thickening, and enations on the leaf undersides.",
        favorableWeather: "Hot humid summer (32°C–42°C) with booming whitefly populations.",
        status: "RAG Advisory & Vector Forecasting",
      },
      {
        name: "Bacterial Blight (Angular Leaf Spot)",
        nameUr: "بیکٹیریل بلائیٹ",
        pathogen: "Xanthomonas citri pv. malvacearum",
        symptoms: "Angular water-soaked lesions bounded by leaf veinlets, black arm lesions on stems.",
        favorableWeather: "High rainfall, monsoon splashing, and 30°C–35°C temps.",
        status: "Extension Advisory",
      },
    ],
    culturalTips: [
      "Plant CLCuD-tolerant approved BT cultivars.",
      "Maintain strict weed management on field borders to suppress whitefly reservoirs.",
      "Monitor yellow sticky traps for early whitefly threshold detection.",
    ],
  },
  {
    id: "rice",
    nameEn: "Rice",
    nameUr: "دھان / چاول",
    scientificName: "Oryza sativa",
    season: "Kharif (June – Nov)",
    seasonUr: "خریف (جون تا نومبر)",
    zones: ["Sheikhupura", "Gujranwala", "Sialkot", "Hafizabad", "Larkana", "Jacobabad"],
    diagnosticStatus: "In Pipeline",
    statusColor: "bg-amber-50 border-amber-200 text-amber-800",
    description: "Premium Basmati and coarse rice belts of the Kalar Tract and Indus delta. Critical focus on blast spores and bacterial leaf blight.",
    diseases: [
      {
        name: "Rice Blast",
        nameUr: "دھان کا بلاسٹ",
        pathogen: "Magnaporthe oryzae (Pyricularia oryzae)",
        symptoms: "Spindle-shaped or diamond lesions with grey centers and dark brown margins.",
        favorableWeather: "20°C–28°C with heavy dew and prolonged leaf wetness (>10 hours).",
        status: "Target Extension Scope",
      },
      {
        name: "Bacterial Leaf Blight (BLB)",
        nameUr: "بیکٹیریل پتہ جھلسائو",
        pathogen: "Xanthomonas oryzae pv. oryzae",
        symptoms: "Water-soaked stripes along leaf margins, coalescing into wavy straw-colored desiccations.",
        favorableWeather: "Monsoon storms with high wind and temperature around 28°C–34°C.",
        status: "RAG Extension Protocol",
      },
    ],
    culturalTips: [
      "Drain nursery floodwaters during suspected bacterial blight outbreaks.",
      "Balance potassium application to strengthen straw and leaf sheath resistance.",
      "Treat nursery beds with certified bio-fungicides prior to transplanting.",
    ],
  },
  {
    id: "sugarcane",
    nameEn: "Sugarcane",
    nameUr: "کماد / گنا",
    scientificName: "Saccharum officinarum",
    season: "Year-Round / Perennial",
    seasonUr: "سال بھر / مستقل",
    zones: ["Faisalabad", "Sargodha", "Mardan", "Badin", "Ghotki", "Mandi Bahauddin"],
    diagnosticStatus: "In Pipeline",
    statusColor: "bg-amber-50 border-amber-200 text-amber-800",
    description: "Vital perennial cash crop sustaining Pakistan's sugar processing agro-industry. Monitored for vascular wilts and red rot spread.",
    diseases: [
      {
        name: "Red Rot",
        nameUr: "رتہ روگ (ریڈ راٹ)",
        pathogen: "Colletotrichum falcatum",
        symptoms: "Third or fourth leaf yellowing, stalks show reddish discoloration with distinct white cross bands internally.",
        favorableWeather: "Waterlogged soils and warm humid rainy spells (28°C–32°C).",
        status: "Advisory & Vector Control",
      },
      {
        name: "Sugarcane Smut",
        nameUr: "کال کنگی (سمٹ)",
        pathogen: "Sporisorium scitamineum",
        symptoms: "Whip-like curved black dusty outgrowth emerging from the apex whorl.",
        favorableWeather: "Dry, hot conditions alternating with humid flushes (25°C–35°C).",
        status: "Target Extension Scope",
      },
    ],
    culturalTips: [
      "Select disease-free seed setts from certified nurseries.",
      "Practice hot water sett treatment (52°C for 30 minutes) before planting.",
      "Rotate fields every 3 years with legumes to break soil-borne inoculum.",
    ],
  },
];

export default function CropsPage() {
  return (
    <div style={{ background: "#F0EDE5", minHeight: "100vh" }}>
      {/* Header — Croplyx deep forest green */}
      <div style={{ background: "#1a3626" }} className="px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Icons.Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pakistan Agro-Ecological Scope</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Supported Crops &amp; Disease Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-white/60 max-w-2xl mt-1 leading-relaxed">
              Detailed agronomic profiles, disease symptoms, meteorological outbreak triggers, and diagnostic capabilities for Pakistan&apos;s 4 core strategic crops.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/diagnose"
              className="inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
              style={{ background: "#16A34A" }}
            >
              <Icons.Camera className="w-4 h-4" />
              <span>Scan Leaf Now</span>
            </Link>
            <Link
              href="/risk-map"
              className="inline-flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-98"
              style={{ background: "rgba(255,255,255,0.12)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Icons.Map className="w-4 h-4 text-emerald-400" />
              <span>Outbreak Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Crop Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {SUPPORTED_CROPS.map((crop) => (
            <div
              key={crop.id}
              id={crop.id}
              className="card-croplyx p-6 sm:p-8 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Crop Title Header */}
                <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "#E5E1D8" }}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-black text-gray-900">
                        {crop.nameEn}
                      </h2>
                      <span className="text-xl font-bold font-serif" style={{ color: "#16A34A" }} dir="rtl">
                        {crop.nameUr}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 italic mt-0.5">
                      {crop.scientificName} · {crop.season} ({crop.seasonUr})
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${crop.statusColor}`}>
                    {crop.diagnosticStatus}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {crop.description}
                </p>

                {/* Major Growing Zones */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.Map className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                    <span>Key Agricultural Districts:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {crop.zones.map((zone) => (
                      <span
                        key={zone}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#374151" }}
                      >
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Diseases Accordion / List */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Monitored Pathogens &amp; Diseases:</span>
                  </span>
                  <div className="space-y-2">
                    {crop.diseases.map((d, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl space-y-1 text-xs"
                        style={{ background: "#FAF8F5", border: "1px solid #E5E1D8" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-900">{d.name} ({d.nameUr})</span>
                          <span className="text-[10px] font-bold" style={{ color: "#15803d" }}>{d.status}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 leading-relaxed">
                          <strong className="text-gray-800">Symptoms:</strong> {d.symptoms}
                        </div>
                        <div className="text-[11px] leading-relaxed" style={{ color: "#92400E" }}>
                          <strong className="text-amber-900">Outbreak Weather:</strong> {d.favorableWeather}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prevention Tips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Icons.ShieldCheck className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                    <span>Recommended Cultural Practices:</span>
                  </span>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 pl-1">
                    {crop.culturalTips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t flex items-center gap-2.5" style={{ borderColor: "#E5E1D8" }}>
                <Link
                  href={`/diagnose?crop=${crop.id}`}
                  className="flex-1 py-2.5 px-3 rounded-xl text-white font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
                  style={{ background: "#1a3626" }}
                >
                  <Icons.Camera className="w-3.5 h-3.5" />
                  <span>Scan {crop.nameEn}</span>
                </Link>
                <Link
                  href={`/advisor`}
                  className="py-2.5 px-4 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
                >
                  <Icons.Message className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
                  <span>Ask Advisor</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
