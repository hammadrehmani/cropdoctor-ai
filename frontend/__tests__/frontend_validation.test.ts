/**
 * Frontend Validation & Logic Tests
 * Pure TypeScript assertions without external test runner globals.
 */

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from "../lib/constants";
import { ApiError } from "../lib/api";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runFrontendValidationTests() {
  assert(ACCEPTED_IMAGE_TYPES.includes("image/jpeg"), "JPEG supported");
  assert(ACCEPTED_IMAGE_TYPES.includes("image/png"), "PNG supported");
  assert(ACCEPTED_IMAGE_TYPES.includes("image/webp"), "WebP supported");
  assert(MAX_FILE_SIZE_MB === 10, "10 MB limit enforced");

  const err503 = new ApiError(503, "AI diagnosis is temporarily unavailable.");
  assert(err503.status === 503, "503 status code mapped");

  const err415 = new ApiError(415, "Unsupported file type.");
  assert(err415.status === 415, "415 status code mapped");
}
