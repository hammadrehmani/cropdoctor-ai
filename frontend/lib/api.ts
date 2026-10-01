/**
 * CropDoctor Ai — Typed API Client
 * All backend calls go through here. Centralises base URL + error handling.
 */

import { getAnonymousDeviceId } from "./device";
import type {
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  CropType,
  DiagnosisHistoryItem,
  DiagnosisHistoryListResponse,
  DiagnosisResponse,
  ExpertRequest,
  ExpertResponse,
  HealthResponse,
  RiskMapResponse,
  WeatherRiskResponse,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Network connection failed: ${msg}`);
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, detail?.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Health ─────────────────────────────────────────────────────────────────────

export const getHealth = (): Promise<HealthResponse> =>
  request<HealthResponse>("/api/v1/health");

// ── Phase 2 Analyze Endpoint (POST /api/v1/analyze) ───────────────────────────

export async function analyzeCrop(
  image: File,
  crop?: string,
  district?: string,
  language?: string
): Promise<AnalyzeResponse> {
  const deviceId = getAnonymousDeviceId();
  const form = new FormData();
  form.append("image", image);
  if (crop) form.append("crop", crop);
  if (district) form.append("district", district);
  if (language) form.append("language", language);
  if (deviceId) form.append("device_id", deviceId);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1/analyze`, {
      method: "POST",
      headers: deviceId ? { "X-Device-Id": deviceId } : undefined,
      body: form,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network connection failed";
    throw new ApiError(
      0,
      `Unable to connect to CropDoctor server (${msg}). Please check your internet connection.`
    );
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    const errorMsg = detail?.detail ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, errorMsg);
  }

  return res.json() as Promise<AnalyzeResponse>;
}

// ── Diagnosis (Legacy Phase 1 Endpoint) ────────────────────────────────────────

export async function diagnose(
  image: File,
  crop: CropType,
  lat?: number,
  lon?: number
): Promise<DiagnosisResponse> {
  const deviceId = getAnonymousDeviceId();
  const form = new FormData();
  form.append("image", image);
  form.append("crop", crop);
  if (lat !== undefined) form.append("lat", String(lat));
  if (lon !== undefined) form.append("lon", String(lon));
  if (deviceId) form.append("device_id", deviceId);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1/diagnose`, {
      method: "POST",
      headers: deviceId ? { "X-Device-Id": deviceId } : undefined,
      body: form,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Network failure: ${msg}`);
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, detail?.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DiagnosisResponse>;
}

// ── Weather ────────────────────────────────────────────────────────────────────

export const getWeather = (
  district: string,
  crop: CropType = "wheat"
): Promise<WeatherRiskResponse> =>
  request<WeatherRiskResponse>(
    `/api/v1/weather/${encodeURIComponent(district)}?crop=${crop}`
  );

export const getWeatherRisk = (
  district: string,
  crop: CropType = "wheat"
): Promise<WeatherRiskResponse> =>
  request<WeatherRiskResponse>(
    `/api/v1/weather/${encodeURIComponent(district)}?crop=${crop}`
  );

// ── Chat ───────────────────────────────────────────────────────────────────────

export const sendChatMessage = (body: ChatRequest): Promise<ChatResponse> =>
  request<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const sendAdvisorMessage = (body: ChatRequest): Promise<ChatResponse> =>
  request<ChatResponse>("/api/v1/advisor", {
    method: "POST",
    body: JSON.stringify(body),
  });

// ── Map ────────────────────────────────────────────────────────────────────────

export const getRiskPoints = (crop: CropType = "wheat"): Promise<RiskMapResponse> =>
  request<RiskMapResponse>(`/api/v1/map/risk-points?crop=${encodeURIComponent(crop)}`);

export const getMapRiskPoints = (crop: CropType = "wheat"): Promise<RiskMapResponse> =>
  request<RiskMapResponse>(`/api/v1/map/risk-points?crop=${encodeURIComponent(crop)}`);

// ── Expert ─────────────────────────────────────────────────────────────────────

export const escalateToExpert = (body: ExpertRequest): Promise<ExpertResponse> =>
  request<ExpertResponse>("/api/v1/expert/escalate", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const getEscalationStatus = (requestId: string): Promise<ExpertResponse> =>
  request<ExpertResponse>(`/api/v1/expert/status/${requestId}`);

// ── Diagnosis History ──────────────────────────────────────────────────────────

export const getDiagnosisHistory = (
  limit = 20,
  offset = 0,
  deviceId?: string
): Promise<DiagnosisHistoryListResponse> => {
  const devId = deviceId ?? getAnonymousDeviceId();
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (devId) {
    queryParams.set("device_id", devId);
  }
  return request<DiagnosisHistoryListResponse>(
    `/api/v1/diagnoses?${queryParams.toString()}`,
    {
      headers: devId ? { "X-Device-Id": devId } : undefined,
    }
  );
};

export const getDiagnosisById = (
  diagnosisId: string
): Promise<DiagnosisHistoryItem> =>
  request<DiagnosisHistoryItem>(`/api/v1/diagnoses/${diagnosisId}`);
