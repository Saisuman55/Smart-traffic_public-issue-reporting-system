// In production (Vercel), use the Railway backend URL
// In development, use relative /api (proxied by Vite to localhost:3000)
const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = rawApiUrl ? `${rawApiUrl}/api` : '/api';
