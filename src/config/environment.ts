/**
 * Central environment-variable access for both browser and server code.
 *
 * `NEXT_PUBLIC_*` values are embedded by Next.js during `next build`.
 * Server-only values are read lazily so an env-free build can load modules.
 */

export type Environment = 'development' | 'production' | 'test';

const LOCAL_APP_URL = 'http://localhost:3000';
const LOCAL_BACKEND_URL = 'http://127.0.0.1:8080';
const SEOUL_API_BASE_URL = 'http://openapi.seoul.go.kr:8088';

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function withPath(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${withoutTrailingSlash(baseUrl)}${normalizedPath}`;
}

function currentEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment | undefined) ?? 'development';
}

/**
 * Runtime-only backend URL for Route Handlers, SSR, and instrumentation.
 * Local development and tests fall back to the loopback backend.
 */
export function getBackendInternalUrl(): string {
  const configured = process.env.BACKEND_INTERNAL_URL?.trim();
  if (configured) {
    return withoutTrailingSlash(configured);
  }

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_BACKEND_URL;
  }

  throw new Error('BACKEND_INTERNAL_URL is required at runtime');
}

/** Runtime-only Seoul Open Data key. Validate it only when handling a request. */
export function getSeoulApiKey(): string {
  const apiKey = process.env.SEOUL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('SEOUL_API_KEY is required at runtime');
  }
  return apiKey;
}

const nodeEnv = currentEnvironment();
const appUrl = withoutTrailingSlash(process.env.NEXT_PUBLIC_APP_URL || LOCAL_APP_URL);
const publicBackendUrl = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_BACKEND_URL || LOCAL_BACKEND_URL
);
const kakaoRedirectUri =
  process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || `${appUrl}/auth/callback`;

export const env = {
  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  appUrl,
  publicBackendUrl,
  kakaoClientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
  kakaoMapApiKey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '',
  kakaoRedirectUri,
  seoulApiBaseUrl: SEOUL_API_BASE_URL,
  createPublicBackendEndpoint(path: string): string {
    return withPath(publicBackendUrl, path);
  },
  createSeoulApiEndpoint(path: string): string {
    return withPath(SEOUL_API_BASE_URL, path);
  },
} as const;

export const NODE_ENV = env.nodeEnv;
export const IS_DEVELOPMENT = env.isDevelopment;
export const IS_PRODUCTION = env.isProduction;
export const APP_URL = env.appUrl;
export const NEXT_PUBLIC_BACKEND_URL = env.publicBackendUrl;
export const KAKAO_CLIENT_ID = env.kakaoClientId;
export const KAKAO_MAP_API_KEY = env.kakaoMapApiKey;
export const KAKAO_REDIRECT_URI = env.kakaoRedirectUri;
