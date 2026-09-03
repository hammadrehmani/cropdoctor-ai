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
    statusColor: "bg-emerald-950/80 border-emerald-700/80 text-emerald-300",
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
    statusColor: "bg-amber-950/80 border-amber-700/80 text-amber-300",
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
    statusColor: "bg-amber-950/80 border-amber-700/80 text-amber-300",
    description: "Premium Basmati and coarse rice belts of the Kalar Tract and Indus delta. Critical focus on blast spores and bacterial leaf blight.",
    diseases: [
      {
        name: "Rice Blast",
        nameUr: "دھان کا بلاسٹ",
        pathogen: "Magnaporthe oryzae (Pyricularia oryzae)",
        symptoms: "Spindle-shaped elliptical lesions with grey/whitish centers and dark reddish borders.",
        favorableWeather: "20°C–28°C with >90% RH and extended leaf wetness.",
        status: "XGBoost Outbreak Risk Model",
      },
      {
        name: "Bacterial Leaf Blight (BLB)",
        nameUr: "بیکٹیریل لیف بلائیٹ",
        pathogen: "Xanthomonas oryzae pv. oryzae",
        symptoms: "Water-soaked stripes starting from leaf tips moving downwards with wavy margins.",
        favorableWeather: "High winds, monsoon downpours, and warm standing water.",
        status: "Extension Protocol",
      },
    ],
    culturalTips: [
      "Avoid excessive split applications of urea after panicle initiation.",
      "Maintain intermittent field drainage during high humidity periods.",
      "Treat seeds with recommended bactericides/fungicides prior to nursery sowing.",
    ],
  },
  {
    id: "sugarcane",
    nameEn: "Sugarcane",
    nameUr: "کماد / گنا",
    scientificName: "Saccharum officinarum",
    season: "Perennial / Annual",
    seasonUr: "سالانہ فصل",
    zones: ["Faisalabad", "Jhang", "Sargodha", "Mardan", "Badin", "Thatta"],
    diagnosticStatus: "In Pipeline",
    statusColor: "bg-amber-950/80 border-amber-700/80 text-amber-300",
    description: "Pakistan's primary sugar and bio-energy crop. Targeted for vascular fungal pathogens and stem borer complexes.",
    diseases: [
      {
        name: "Red Rot",
        nameUr: "کماد کا رتہ روگ",
        pathogen: "Colletotrichum falcatum",
        symptoms: "Yellowing and withering of upper leaf spindle; internal cane flesh exhibits red tissue with transverse white patches.",
        favorableWeather: "Waterlogging, high humidity (>85%), and temps between 27°C–32°C.",
        status: "Agronomic Advisory",
      },
      {
        name: "Sugarcane Smut",
        nameUr: "کماد کا کنگی روگ / اسمٹ",
        pathogen: "Sporisorium scitamineum",
        symptoms: "Production of a long, whip-like black dusty structure from the terminal shoot.",
        favorableWeather: "Dry, hot conditions followed by humid flushes.",
        status: "Diagnostic Protocol",
      },
    ],
    culturalTips: [
      "Select disease-free healthy seed sets from inspected nurseries.",
      "Perform hot-water seed treatment (50°C for 2 hours) before planting.",
      "Practice crop rotation and avoid ratooning infected cane fields.",
    ],
  },
];

export default function CropsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-semibold mb-2">
            <Icons.Leaf className="w-3.5 h-3.5" />
            <span>Pakistan Agro-Ecological Scope</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight">
            Supported Crops &amp; Disease Intelligence
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl mt-1">
            Detailed agronomic profiles, disease symptoms, meteorological outbreak triggers, and diagnostic capabilities for Pakistan&apos;s 4 core strategic crops.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/diagnose"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/80 transition-all"
          >
            <Icons.Camera className="w-4 h-4" />
            <span>Scan Leaf Now</span>
          </Link>
          <Link
            href="/risk-map"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <Icons.Map className="w-4 h-4 text-emerald-400" />
            <span>Outbreak Map</span>
          </Link>
        </div>
      </div>

      {/* Crop Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {SUPPORTED_CROPS.map((crop) => (
          <div
            key={crop.id}
            id={crop.id}
            className="glass rounded-3xl border border-gray-800 p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-emerald-700/60 transition-all shadow-xl"
          >
            <div className="space-y-4">
              {/* Crop Title Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-black text-gray-100">
                      {crop.nameEn}
                    </h2>
                    <span className="text-xl font-bold text-emerald-400 font-serif" dir="rtl">
                      {crop.nameUr}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 italic mt-0.5">
                    {crop.scientificName} · {crop.season} ({crop.seasonUr})
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border shrink-0 ${crop.statusColor}`}>
                  {crop.diagnosticStatus}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {crop.description}
              </p>

              {/* Major Growing Zones */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Map className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Key Agricultural Districts:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {crop.zones.map((zone) => (
                    <span
                      key={zone}
                      className="px-2.5 py-0.5 rounded-lg bg-gray-900/90 border border-gray-800 text-[11px] text-gray-300 font-medium"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Diseases Accordion / List */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Monitored Pathogens &amp; Diseases:</span>
                </span>
                <div className="space-y-2">
                  {crop.diseases.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-200">{d.name} ({d.nameUr})</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{d.status}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 leading-relaxed">
                        <strong className="text-gray-300">Symptoms:</strong> {d.symptoms}
                      </div>
                      <div className="text-[11px] text-amber-400/90 leading-relaxed">
                        <strong className="text-amber-300">Outbreak Weather:</strong> {d.favorableWeather}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recommended Cultural Practices:</span>
                </span>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1 pl-1">
                  {crop.culturalTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-gray-800/80 flex items-center gap-2">
              <Link
                href={`/diagnose?crop=${crop.id}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
              >
                <Icons.Camera className="w-3.5 h-3.5" />
                <span>Scan {crop.nameEn}</span>
              </Link>
              <Link
                href={`/advisor`}
                className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
              >
                <Icons.Message className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ask Advisor</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
