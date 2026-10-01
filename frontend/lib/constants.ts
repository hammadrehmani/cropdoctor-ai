/**
 * CropDoctor Ai — App Constants & Multilingual Content
 */

import type { CropType, Language } from "./types";

// ── API ────────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const IS_DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ── Crops ──────────────────────────────────────────────────────────────────────

export const CROPS: Array<{
  value: CropType;
  label: string;
  labelUr: string;
  labelSd: string;
  emoji: string;
}> = [
  { value: "cotton",    label: "Cotton",    labelUr: "کپاس",   labelSd: "ڪپهه",  emoji: "🌿" },
  { value: "wheat",     label: "Wheat",     labelUr: "گندم",   labelSd: "ڪڻڪ",   emoji: "🌾" },
  { value: "rice",      label: "Rice",      labelUr: "چاول",   labelSd: "ساريون", emoji: "🌱" },
  { value: "sugarcane", label: "Sugarcane", labelUr: "گنا",    labelSd: "ڪمند",  emoji: "🎋" },
];

// ── Languages ──────────────────────────────────────────────────────────────────

export const LANGUAGES: Array<{ value: Language; label: string; nativeLabel: string }> = [
  { value: "en", label: "English",  nativeLabel: "English" },
  { value: "ur", label: "Urdu",     nativeLabel: "اردو" },
  { value: "sd", label: "Sindhi",   nativeLabel: "سنڌي" },
];

// ── Risk Levels ────────────────────────────────────────────────────────────────

export const RISK_COLOURS = {
  LOW:      { bg: "#22c55e", text: "#166534", label: "Low Risk", labelUr: "کم خطرہ", labelSd: "گھٽ خطرو" },
  MEDIUM:   { bg: "#f59e0b", text: "#92400e", label: "Medium Risk", labelUr: "درمیانہ خطرہ", labelSd: "وچولو خطرو" },
  HIGH:     { bg: "#f97316", text: "#9a3412", label: "High Risk", labelUr: "زیادہ خطرہ", labelSd: "تمام گھڻو خطرو" },
  CRITICAL: { bg: "#ef4444", text: "#991b1b", label: "Critical", labelUr: "انتہائی خطرہ", labelSd: "نازڪ خطرو" },
} as const;

// ── Pakistan Districts ─────────────────────────────────────────────────────────

export const DEMO_DISTRICTS = [
  "Lahore", "Faisalabad", "Multan", "Gujranwala", "Rawalpindi",
  "Bahawalpur", "Sargodha", "Sialkot", "Sahiwal", "Okara",
  "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah",
  "Peshawar", "Mardan", "Quetta",
];

// ── Map ────────────────────────────────────────────────────────────────────────

export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];
export const PAKISTAN_ZOOM = 6;

// ── File Upload ────────────────────────────────────────────────────────────────

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_MB = 10;

// ── Core Multilingual UI Translations ──────────────────────────────────────────

export const UI_TRANSLATIONS = {
  en: {
    appTitle: "CropDoctor AI",
    tagline: "AI-Powered Plant Disease & Pest Identification System for Smart Farming",
    subtagline: "CropDoctor AI does not only identify plant diseases and pests. It explains the diagnosis with Grad-CAM, measures OpenCV severity, and forecasts district-level risk.",
    scanCrop: "Scan a Crop",
    viewMap: "View Risk Map",
    dashboard: "History / Dashboard",
    advisor: "AI Advisor",
    expertConsult: "Expert Connect",
    privacyNotice: "Zero location tracking · 100% anonymous",
    supportedCrops: "Supported Crops in Pakistan",
    takePhoto: "Take Photo / Camera",
    uploadGallery: "Upload from Gallery",
    photoInstruction: "Take a clear photo of the affected leaf.",
    changePhoto: "Change",
    removePhoto: "Remove",
    selectCrop: "Select Crop Type",
    responseLang: "Response Language",
    selectDistrict: "District (Optional)",
    analyzingLeaf: "Analyzing leaf...",
    estimatingSeverity: "Estimating severity...",
    preparingExplanation: "Preparing explanation...",
    keepBrowserOpen: "Please keep your browser window open.",
    diagnosisTitle: "AI Crop Diagnosis",
    confidence: "Confidence",
    severity: "Disease Severity",
    affectedArea: "Estimated Affected Leaf Area",
    whyModelThinksThis: "Visual Explanation (Grad-CAM)",
    gradcamExplanation: "Highlighted regions show the areas that influenced the AI's prediction most.",
    lowConfidenceWarning: "AI confidence is low. Please consult an agricultural expert before taking action.",
    expertRecommended: "Expert Review Recommended",
    contactWhatsApp: "Contact Agricultural Expert on WhatsApp",
    askAdvisor: "Ask AI Advisor",
    scanAnother: "Scan Another",
    noHistory: "You haven't scanned a crop yet.",
    scanFirstCrop: "Scan your first crop",
    recentScans: "Recent Crop Diagnoses",
    anonymousDeviceNotice: "Diagnosis history is securely isolated to this anonymous device.",
    opencvDisclaimer: "Severity is estimated using an OpenCV image-analysis heuristic and has not been scientifically validated as a precise agronomic measurement.",
    geoPrivacyNotice: "All map markers represent public district centroid reference coordinates. No individual farmer GPS coordinates are ever stored or displayed.",
    scientificDisclaimer: "Disease risk scores are prototype estimations computed from real Open-Meteo weather parameters and the multi-factor risk model.",
  },
  ur: {
    appTitle: "کراپ ڈاکٹر AI",
    tagline: "سمارٹ فارمنگ کے لیے پودوں کی بیماریوں اور کیڑوں کی شناخت کا جدید نظام",
    subtagline: "کراپ ڈاکٹر AI نہ صرف پودوں کی بیماریوں اور کیڑوں کی تشخیص کرتا ہے بلکہ Grad-CAM سے ثبوت، شدت کا تعین اور ضلعی خطرات کی پیش گوئی بھی کرتا ہے۔",
    scanCrop: "فصل اسکین کریں",
    viewMap: "رسک میپ دیکھیں",
    dashboard: "ہسٹری / ڈیش بورڈ",
    advisor: "زرعی مشیر",
    expertConsult: "زرعی ماہر سے رابطہ",
    privacyNotice: "کوئی ذاتی لوکیشن محفوظ نہیں ہوتی · مکمل طور پر گمنام",
    supportedCrops: "پاکستان کی اہم معاونت شدہ فصلیں",
    takePhoto: "کیمرہ / تصویر بنائیں",
    uploadGallery: "گیلری سے منتخب کریں",
    photoInstruction: "متاثرہ پتے کی واضح تصویر لیں۔",
    changePhoto: "تبدیل کریں",
    removePhoto: "ختم کریں",
    selectCrop: "فصل کی قسم منتخب کریں",
    responseLang: "جواب کی زبان",
    selectDistrict: "ضلع منتخب کریں (اختیاری)",
    analyzingLeaf: "پتے کا تجزیہ کیا جا رہا ہے...",
    estimatingSeverity: "بیماری کی شدت کا تخمینہ لگایا جا رہا ہے...",
    preparingExplanation: "تفصیلی وضاحت تیار کی جا رہی ہے...",
    keepBrowserOpen: "براہ کرم براؤزر کھلا رکھیں۔",
    diagnosisTitle: "اے آئی تشخیصی رپورٹ",
    confidence: "یقینی تناسب",
    severity: "بیماری کی شدت",
    affectedArea: "متاثرہ پتے کا تخمینہ شدہ رقبہ",
    whyModelThinksThis: "بصری تشخیصی ثبوت (Grad-CAM)",
    gradcamExplanation: "نمایاں کردہ حصے پتے کے ان حصوں کی نشاندہی کرتے ہیں جن سے ماڈل نے تشخیص کا فیصلہ کیا۔",
    lowConfidenceWarning: "اے آئی ماڈل کا اعتماد کم ہے۔ کوئی بھی عملی اقدام کرنے سے پہلے زرعی ماہر سے مشورہ لیں۔",
    expertRecommended: "ماہرانہ جائزے کی سفارش",
    contactWhatsApp: "واٹس ایپ پر زرعی ماہر سے رابطہ کریں",
    askAdvisor: "زرعی مشیر سے پوچھیں",
    scanAnother: "مزید اسکین کریں",
    noHistory: "آپ نے ابھی تک کوئی فصل اسکین نہیں کی۔",
    scanFirstCrop: "اپنی پہلی فصل اسکین کریں",
    recentScans: "حالیہ تشخیصی ریکارڈ",
    anonymousDeviceNotice: "تشخیصی ہسٹری محفوظ طریقے سے آپ کے گمنام ڈیوائس تک محدود ہے۔",
    opencvDisclaimer: "شدت کا تخمینہ اوپن سی وی امیج اینالیسس پر مبنی ہے جو کہ ایک تخمینہ ہے۔",
    geoPrivacyNotice: "نقشے پر تمام ڈیٹا صرف ضلعی سطح پر دکھایا جاتا ہے۔ کسی کسان کے ذاتی کوآرڈینیٹس محفوظ نہیں کیے جاتے۔",
    scientificDisclaimer: "بیماری کے خطرے کا اسکور اوپن میٹیو موسم اور ماڈل پر مبنی ابتدائی اشاریہ ہے۔",
  },
  sd: {
    appTitle: "ڪراپ ڊاڪٽر AI",
    tagline: "سمارٽ فارمنگ لاءِ ٻوٽن جي بيمارين ۽ جيتن جي سڃاڻپ جو نظام",
    subtagline: "ڪراپ ڊاڪٽر AI نه رڳو ٻوٽن جي بيمارين ۽ جيتن جي سڃاڻپ ڪري ٿو پر ان جي وضاحت، شدت ۽ ضلعي سطح جي خطري جي اڳڪٿي پڻ ڪري ٿو.",
    scanCrop: "فصل اسڪين ڪريو",
    viewMap: "رسڪ نقشو ڏسو",
    dashboard: "هسٽري / ڊيش بورڊ",
    advisor: "زرعي صلاحڪار",
    expertConsult: "ماهر سان رابطو",
    privacyNotice: "ڪابه ذاتي لوڪيشن محفوظ ناهي · مڪمل طور گمنام",
    supportedCrops: "سنڌ ۽ پاڪستان جون مکيه فصلون",
    takePhoto: "ڪيمرا سان فوٽو ڪڍو",
    uploadGallery: "گيلري مان چونڊيو",
    photoInstruction: "متاثر پن جي چٽي تصوير ڪڍو.",
    changePhoto: "تبديل ڪريو",
    removePhoto: "ختم ڪريو",
    selectCrop: "فصل چونڊيو",
    responseLang: "جواب جي ٻولي",
    selectDistrict: "ضلعو چونڊيو (اختياري)",
    analyzingLeaf: "پن جو جائزو ورتو پيو وڃي...",
    estimatingSeverity: "بيماريءَ جي شدت جو اندازو لڳايو پيو وڃي...",
    preparingExplanation: "وضاحت تيار ڪئي پئي وڃي...",
    keepBrowserOpen: "مهرباني ڪري براؤزر کليل رکو.",
    diagnosisTitle: "اي آءِ تشخيصي رپورٽ",
    confidence: "يقيني تناسب",
    severity: "بيماريءَ جي شدت",
    affectedArea: "متاثر پن جو اندازيل علائقو",
    whyModelThinksThis: "بصري وضاحت (Grad-CAM)",
    gradcamExplanation: "نمايان علائقا پن جي انهن حصن کي ظاهر ڪن ٿا جن جي بنياد تي ماڊل فيصلو ڪيو.",
    lowConfidenceWarning: "اي آءِ جو يقيني تناسب گھٽ آهي. ڪنهن به قدم کڻڻ کان اڳ زرعي ماهر سان صلاح ڪريو.",
    expertRecommended: "زرعي ماهر جي رهنمائي ضروري آهي",
    contactWhatsApp: "واٽس ايپ تي زرعي ماهر سان رابطو ڪريو",
    askAdvisor: "اي آءِ صلاحڪار کان پڇو",
    scanAnother: "ٻيو اسڪين ڪريو",
    noHistory: "توهان اڃا تائين ڪو فصل اسڪين ناهي ڪيو.",
    scanFirstCrop: "پنهنجو پهريون فصل اسڪين ڪريو",
    recentScans: "تازا تشخيصي رڪارڊ",
    anonymousDeviceNotice: "تشخيصي هسٽري محفوظ طريقي سان اوهان جي گمنام ڊوائيس تائين محدود آهي.",
    opencvDisclaimer: "شدت جو اندازو تصويري تجزيي تي ٻڌل آهي ۽ هي هڪ شروعاتي تخمينو آهي.",
    geoPrivacyNotice: "نقشي تي سمورو ڊيٽا صرف ضلعي سطح تي ڏيکاريو ويندو آهي، ڪنهن به هاريءَ جا ذاتي ڪوآرڊينيٽس محفوظ نه آهن.",
    scientificDisclaimer: "بيماريءَ جي خطري جو اسڪور اوپن ميٽيو موسم ۽ رسڪ ماڊل تي ٻڌل هڪ اڳڪٿي آهي.",
  },
} as const;
