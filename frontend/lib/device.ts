/**
 * AgriGuard AI — Anonymous Device ID Manager
 * Generates and stores a unique anonymous device UUID in localStorage.
 * Ensures farmer diagnosis history is isolated per device without login credentials.
 */

const DEVICE_ID_KEY = "agriguard_device_id";

export function getAnonymousDeviceId(): string {
  if (typeof window === "undefined") {
    return "anonymous-device-ssr";
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `device_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    // If localStorage is unavailable or throws (e.g. strict privacy mode), fallback gracefully
    return "anonymous-device-fallback";
  }
}
