const defaultBackendUrl = "http://localhost:8001";
const configuredBackendUrl = process.env.BACKEND_URL?.trim();
const requiresConfiguredBackendUrl =
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

export const BACKEND_URL = (
  configuredBackendUrl || defaultBackendUrl
).replace(/\/+$/, "");

export const BACKEND_URL_CONFIG_ERROR =
  requiresConfiguredBackendUrl && !configuredBackendUrl
    ? "BACKEND_URL is not configured for this production deployment."
    : null;
