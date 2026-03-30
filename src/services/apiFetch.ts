// Central API fetch helper — works in both dev and production
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '';

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  // path should start with /api/...
  return fetch(`${BASE}${path}`, options);
}
