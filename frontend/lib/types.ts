/**
 * AgriGuard AI — Shared TypeScript Types
 * Mirrors backend Pydantic schemas for full-stack type safety.
 */

// ── Enums ──────────────────────────────────────────────────────────────────────

export type CropType = "cotton" | "wheat" | "rice" | "sugarcane";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Language = "en" | "ur" | "sd";
export type SeverityTier = "healthy" | "low" | "moderate" | "severe";

// ── Phase 2 Analyze API Schemas ────────────────────────────────────────────────

export interface TopPrediction {
  disease: string;
  confidence: number;
}

export interface DiagnosisDetail {
  disease: string;
  crop?: string | null;
  confidence: number;
  uncertain: boolean;
  top_predictions: TopPrediction[];
  is_mock: boolean;
}

export interface SeverityDetail {
  affected_percentage: number;
  tier: SeverityTier;
  is_mock?: boolean;
}

export interface ExplanationDetail {
  gradcam_image: string | null;
  key_regions?: string | null;
}

export interface AnalyzeResponse {
  success: boolean;
  diagnosis_id?: string;
  diagnosis: DiagnosisDetail;
  severity: SeverityDetail;
  explanation: ExplanationDetail;
  escalate: boolean;
  is_mock: boolean;
}

// ── Phase 1 Diagnosis Response (Legacy Compat) ─────────────────────────────────

export interface DiagnosisResponse {
  diagnosis_id: string;
  crop: CropType;
  disease: string;
  confidence: number;
  severity_pct: number;
  risk_level: RiskLevel;
  gradcam_url: string | null;
  district: string | null;
  escalate: boolean;
  is_mock: boolean;
}

// ── Weather ────────────────────────────────────────────────────────────────────

export interface DailyWeather {
  date: string;
  temperature_mean: number;
  humidity_mean: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  risk_score: number;
  risk_label: RiskLevel | string;
  primary_driver?: string | null;
}

export interface WeatherRiskResponse {
  district: string;
  crop: CropType;
  forecast: DailyWeather[];
  overall_risk_score: number;
  overall_risk_label: RiskLevel | string;
  primary_driver?: string | null;
  is_mock: boolean;
}

// ── Geospatial Risk Map ────────────────────────────────────────────────────────

export interface RiskPoint {
  district: string;
  lat: number;
  lon: number;
  risk_score: number;
  risk_label: RiskLevel | string;
  crop?: CropType | string;
  primary_driver?: string | null;
  case_count?: number;
}

export interface RiskMapResponse {
  crop: CropType | string;
  points: RiskPoint[];
  total_cases?: number;
}

// ── Chat & Advisor ─────────────────────────────────────────────────────────────

export interface DiagnosisContext {
  disease?: string;
  crop?: string;
  confidence?: number;
  severity_tier?: string;
  affected_percentage?: number;
}

export interface ChatRequest {
  message: string;
  language: Language;
  crop?: CropType;
  district?: string;
  session_id?: string;
  diagnosis_context?: DiagnosisContext;
}

export interface SourceItem {
  title: string;
  source: string;
  chunk_id?: string;
}

export interface ChatResponse {
  success?: boolean;
  answer: string;
  sources: (SourceItem | string)[];
  language: Language;
  session_id: string;
  escalate: boolean;
  retrieval_score?: number;
  is_mock: boolean;
}

// ── Map alias ──────────────────────────────────────────────────────────────────
export type MapRiskResponse = RiskMapResponse;

// ── Expert ─────────────────────────────────────────────────────────────────────

export interface ExpertRequest {
  source: "diagnosis" | "chat";
  diagnosis_id?: string;
  chat_session_id?: string;
  crop?: CropType;
  disease?: string;
  confidence?: number;
  context?: string;
}

export interface ExpertResponse {
  request_id: string;
  status: "pending" | "assigned" | "resolved";
  message: string;
}

// ── Health ─────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  mock_ml_models: boolean;
  diagnosis_mock_mode?: boolean;
  classifier_loaded: boolean;
}

// ── Diagnosis History ──────────────────────────────────────────────────────────

export interface DiagnosisHistoryItem {
  id: string;
  crop: string;
  disease: string;
  confidence: number;
  uncertain?: boolean;
  severity_pct: number;
  severity_tier: string;
  district?: string | null;
  device_id?: string | null;
  escalated: boolean;
  is_mock: boolean;
  created_at: string;
}

export interface DiagnosisHistoryListResponse {
  items: DiagnosisHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}
