const defaultBackendUrl = "http://localhost:8001";

export const BACKEND_URL = (
  process.env.BACKEND_URL || defaultBackendUrl
).replace(/\/+$/, "");
