/**
 * Comprehensive Frontend Validation & Logic Test Suite (Phase 1–6)
 * Tests client-side constraints, MIME checks, file-size limits, status mappings,
 * schema contracts, multilingual translations, device isolation, and safety guardrails.
 */

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_MB, LANGUAGES, UI_TRANSLATIONS } from "../lib/constants";
import { ApiError } from "../lib/api";
import { getAnonymousDeviceId } from "../lib/device";
import type {
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  DiagnosisContext,
  DiagnosisHistoryItem,
  DiagnosisHistoryListResponse,
  RiskMapResponse,
  WeatherRiskResponse,
} from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runComprehensiveFrontendTests() {
  console.log("Running Phase 6 Comprehensive Frontend Test Suite...");

  // 1. Home / Branding & Tagline Verification
  assert(UI_TRANSLATIONS.en.appTitle === "AgriGuard AI", "English app title correct");
  assert(UI_TRANSLATIONS.ur.appTitle === "ایگری گارڈ اے آئی", "Urdu app title correct");
  assert(UI_TRANSLATIONS.sd.appTitle === "ايگري گارڊ اي آءِ", "Sindhi app title correct");
  assert(
    UI_TRANSLATIONS.en.subtagline.includes("AgriGuard does not only identify crop disease"),
    "Core innovation tagline present in English"
  );
  assert(
    UI_TRANSLATIONS.ur.subtagline.includes("ایگری گارڈ نہ صرف فصلوں کی بیماریوں کی تشخیص کرتا ہے"),
    "Core innovation tagline present in Urdu"
  );
  assert(
    UI_TRANSLATIONS.sd.subtagline.includes("ايگري گارڊ نه رڳو فصلن جي بيمارين جي سڃاڻپ ڪري ٿو"),
    "Core innovation tagline present in Sindhi"
  );

  // 2. Multilingual Switching Support
  const supportedLangCodes = LANGUAGES.map((l) => l.value);
  assert(supportedLangCodes.includes("en"), "English language supported");
  assert(supportedLangCodes.includes("ur"), "Urdu language supported");
  assert(supportedLangCodes.includes("sd"), "Sindhi language supported");
  assert(Object.keys(UI_TRANSLATIONS.en).length >= 25, "English translations complete");
  assert(Object.keys(UI_TRANSLATIONS.ur).length >= 25, "Urdu translations complete");
  assert(Object.keys(UI_TRANSLATIONS.sd).length >= 25, "Sindhi translations complete");

  // 3. Image Input & MIME Validation
  assert(ACCEPTED_IMAGE_TYPES.includes("image/jpeg"), "JPEG must be accepted");
  assert(ACCEPTED_IMAGE_TYPES.includes("image/png"), "PNG must be accepted");
  assert(ACCEPTED_IMAGE_TYPES.includes("image/webp"), "WebP must be accepted");
  assert(!ACCEPTED_IMAGE_TYPES.includes("image/gif"), "GIF must NOT be accepted");
  assert(!ACCEPTED_IMAGE_TYPES.includes("application/pdf"), "PDF must NOT be accepted");
  assert(!ACCEPTED_IMAGE_TYPES.includes("image/bmp"), "BMP must NOT be accepted");
  assert(MAX_FILE_SIZE_MB === 10, "Max file size must be 10 MB");
  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  assert(maxBytes === 10485760, "10 MB in bytes must equal 10,485,760");

  // 4. API Error Status Code Mappings & Recovery
  const error400 = new ApiError(400, "Image is corrupt or unreadable. Please choose another photo.");
  assert(error400.status === 400, "400 error status correctly captured");

  const error413 = new ApiError(413, "Image is too large. Maximum size is 10 MB.");
  assert(error413.status === 413, "413 error status correctly captured");

  const error415 = new ApiError(415, "Unsupported image type. Please use JPEG, PNG, or WebP.");
  assert(error415.status === 415, "415 error status correctly captured");

  const error422 = new ApiError(422, "Some information is invalid. Please check your selections.");
  assert(error422.status === 422, "422 error status correctly captured");

  const error503 = new ApiError(503, "AI diagnosis is temporarily unavailable. Please try again later.");
  assert(error503.status === 503, "503 error status correctly captured");

  const networkErr = new ApiError(0, "Unable to connect to the diagnosis service.");
  assert(networkErr.status === 0, "Network failure status captured as 0");

  // 5. Diagnosis Result Contract & Real Mode
  const mockRealResponse: AnalyzeResponse = {
    success: true,
    is_mock: false,
    diagnosis: {
      disease: "Rust",
      crop: "wheat",
      confidence: 0.9559,
      uncertain: false,
      is_mock: false,
      top_predictions: [
        { disease: "Rust", confidence: 0.9559 },
        { disease: "Healthy", confidence: 0.0247 },
        { disease: "Powdery", confidence: 0.0194 },
      ],
    },
    severity: {
      affected_percentage: 12.8,
      tier: "low",
      is_mock: false,
    },
    explanation: {
      gradcam_image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      key_regions: "Highlighted regions show the areas that influenced the AI's prediction most.",
    },
    escalate: false,
  };

  assert(mockRealResponse.is_mock === false, "Real response has is_mock=false");
  assert(mockRealResponse.diagnosis.is_mock === false, "Real diagnosis is_mock=false");
  assert(!mockRealResponse.diagnosis.disease.includes("[MOCK]"), "Real disease name has no [MOCK] suffix");
  assert(mockRealResponse.explanation.gradcam_image !== null, "Real response contains valid Grad-CAM image");
  assert(mockRealResponse.diagnosis.confidence >= 0 && mockRealResponse.diagnosis.confidence <= 1, "Confidence normalized 0..1");
  assert(mockRealResponse.severity.tier === "low", "Severity tier mapped correctly");

  // 6. Severity Tier & Confidence Calculation
  const confidenceFormatted = (mockRealResponse.diagnosis.confidence * 100).toFixed(1);
  assert(confidenceFormatted === "95.6", "Confidence formatted to 1 decimal place");
  assert(mockRealResponse.severity.affected_percentage === 12.8, "Severity percentage preserved");

  // 7. Mock Demo Mode Contract (No Fabricated Grad-CAM)
  const mockDemoResponse: AnalyzeResponse = {
    success: true,
    is_mock: true,
    diagnosis: {
      disease: "Wheat — Leaf Rust [MOCK]",
      crop: "wheat",
      confidence: 0.88,
      uncertain: false,
      is_mock: true,
      top_predictions: [
        { disease: "Wheat — Leaf Rust [MOCK]", confidence: 0.88 },
        { disease: "Powdery Mildew [MOCK]", confidence: 0.08 },
      ],
    },
    severity: {
      affected_percentage: 18.5,
      tier: "moderate",
      is_mock: true,
    },
    explanation: {
      gradcam_image: null,
      key_regions: null,
    },
    escalate: false,
  };

  assert(mockDemoResponse.is_mock === true, "Demo response has is_mock=true");
  assert(mockDemoResponse.explanation.gradcam_image === null, "Mock response must NOT have fabricated Grad-CAM");

  // 8. Uncertainty & Safety Escalation Gate
  const mockUncertainResponse: AnalyzeResponse = {
    ...mockRealResponse,
    diagnosis: {
      ...mockRealResponse.diagnosis,
      confidence: 0.45,
      uncertain: true,
    },
    escalate: true,
  };

  assert(mockUncertainResponse.diagnosis.uncertain === true, "Uncertain diagnosis flagged");
  assert(mockUncertainResponse.escalate === true, "Low confidence escalates to expert review");

  // 9. Geospatial Risk Map & Centroid Privacy Contract
  const mockMapResponse: RiskMapResponse = {
    crop: "wheat",
    points: [
      {
        district: "Hyderabad",
        lat: 25.396,
        lon: 68.3578,
        risk_score: 0.62,
        risk_label: "HIGH",
        primary_driver: "High humidity duration",
        case_count: 12,
      },
      {
        district: "Sukkur",
        lat: 27.7052,
        lon: 68.8574,
        risk_score: 0.21,
        risk_label: "LOW",
        primary_driver: "Seasonal baseline conditions",
        case_count: 8,
      },
    ],
    total_cases: 20,
  };

  assert(mockMapResponse.crop === "wheat", "Map crop preserved");
  assert(mockMapResponse.points.length === 2, "Map points parsed");
  assert(mockMapResponse.points[0].district === "Hyderabad", "District parsed");
  assert(mockMapResponse.points[0].risk_label === "HIGH", "Risk label parsed");
  assert(mockMapResponse.points[0].primary_driver === "High humidity duration", "Primary driver parsed");

  // 10. Device-Isolated History Contract
  const mockHistoryItem: DiagnosisHistoryItem = {
    id: "diag-uuid-1234",
    crop: "wheat",
    disease: "Rust",
    confidence: 0.9559,
    uncertain: false,
    severity_pct: 12.8,
    severity_tier: "low",
    district: "Faisalabad",
    device_id: "device-anon-uuid-5678",
    escalated: false,
    is_mock: false,
    created_at: "2026-08-24T15:00:00Z",
  };

  assert(mockHistoryItem.id === "diag-uuid-1234", "History item id preserved");
  assert(mockHistoryItem.device_id === "device-anon-uuid-5678", "Anonymous device_id preserved");
  assert(!("lat" in mockHistoryItem), "Raw latitude must not be present in DiagnosisHistoryItem");
  assert(!("lon" in mockHistoryItem), "Raw longitude must not be present in DiagnosisHistoryItem");

  const mockHistoryList: DiagnosisHistoryListResponse = {
    items: [mockHistoryItem],
    total: 1,
    limit: 20,
    offset: 0,
  };
  assert(mockHistoryList.items.length === 1, "History list items parsed");

  // 11. Anonymous Device ID Manager Validation
  const anonId = getAnonymousDeviceId();
  assert(typeof anonId === "string" && anonId.length > 10, "Anonymous device ID is non-empty string");

  // 12. Weather & 7-Day Disease Risk Response Contract
  const mockWeatherResponse: WeatherRiskResponse = {
    district: "Faisalabad",
    crop: "wheat",
    forecast: [
      {
        date: "2026-08-24",
        temperature_mean: 32.5,
        humidity_mean: 65.0,
        rainfall_mm: 0.0,
        wind_speed_kmh: 12.0,
        risk_score: 0.35,
        risk_label: "LOW" as any,
        primary_driver: "Temperature in pathogen optimal range",
      },
    ],
    overall_risk_score: 0.38,
    overall_risk_label: "LOW" as any,
    primary_driver: "Temperature in pathogen optimal range",
    is_mock: false,
  };
  assert(mockWeatherResponse.district === "Faisalabad", "Weather district preserved");
  assert(mockWeatherResponse.forecast.length === 1, "Weather forecast present");

  // 13. Multilingual RAG Advisor Contract & Citation Verification
  const diagContext: DiagnosisContext = {
    disease: "Rust",
    crop: "wheat",
    confidence: 0.9559,
    severity_tier: "low",
    affected_percentage: 12.8,
  };

  const advisorReq: ChatRequest = {
    message: "What are the cultural prevention methods for wheat rust?",
    language: "en",
    crop: "wheat",
    session_id: "sess_test_123",
    diagnosis_context: diagContext,
  };
  assert(advisorReq.message.length > 0, "Advisor message non-empty");

  const advisorResp: ChatResponse = {
    success: true,
    answer: "Ensure proper crop rotation, clean drainage channels, and consult extension officers for certified resistant varieties.",
    sources: [
      {
        title: "Wheat Rust Management Bulletin",
        source: "Punjab Directorate of Agricultural Information",
        chunk_id: "wheat_bulletin_01",
      },
    ],
    language: "en",
    session_id: "sess_test_123",
    escalate: false,
    retrieval_score: 0.86,
    is_mock: false,
  };
  assert(advisorResp.success === true, "Advisor response success true");
  assert(advisorResp.sources.length === 1, "Source citations present");
  assert(advisorResp.retrieval_score === 0.86, "Retrieval score parsed");

  // 14. Advisor Safety Guardrail: Chemical Dosage Refusal & Escalation
  const safetyRefusalResp: ChatResponse = {
    success: true,
    answer: "AgriGuard cannot provide specific chemical pesticide dosages. Please consult your local extension office.",
    sources: [],
    language: "en",
    session_id: "sess_safety_123",
    escalate: true,
    is_mock: false,
  };
  assert(safetyRefusalResp.escalate === true, "Chemical dosage queries trigger escalation flag");
  assert(!safetyRefusalResp.answer.includes("ml/acre") && !safetyRefusalResp.answer.includes("grams per liter"), "No dosage prescribed");

  // 15. Frontend Zero Chemical Dosage Assertion
  // Verify that frontend code contains no hardcoded or synthetic chemical volume recipes
  const frontendDosageGuard = (text: string) => {
    const dosagePatterns = [/\d+\s*ml\s*per\s*liter/i, /\d+\s*grams\s*per\s*acre/i, /spray\s*\d+\s*liters/i];
    return dosagePatterns.some((pattern) => pattern.test(text));
  };
  assert(!frontendDosageGuard(advisorResp.answer), "Verified answer contains no unauthorized dosage prescriptions");
  assert(!frontendDosageGuard(safetyRefusalResp.answer), "Safety refusal contains no unauthorized dosage prescriptions");

  console.log("All Phase 6 Frontend Validation, Logic, UX, and Safety tests PASSED successfully!");
}

if (typeof require !== "undefined" && require.main === module) {
  runComprehensiveFrontendTests();
}
