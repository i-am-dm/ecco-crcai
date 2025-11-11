const rawApiUrl = import.meta.env.VITE_API_URL;
const defaultApiUrl = import.meta.env.PROD ? '/api' : 'http://localhost:8085';

export const config = {
  apiUrl: rawApiUrl && rawApiUrl.trim().length > 0 ? rawApiUrl : defaultApiUrl,
  defaultEnv: (import.meta.env.VITE_DEFAULT_ENV || 'dev') as 'dev' | 'stg' | 'prod',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  },
} as const;
