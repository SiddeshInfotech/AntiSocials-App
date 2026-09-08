import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const PRODUCTION_API_URL = 'https://antisocials-app.onrender.com';
export const DEVELOPMENT_API_URL = 'http://localhost:5000';

const configuredUrl = (
  typeof process !== 'undefined'
    ? (process?.env?.EXPO_PUBLIC_API_URL || process?.env?.EXPO_PUBLIC_API_BASE_URL || '')
    : ''
).trim();

// Try hostUri (Expo CLI host)
const expoHost = Constants.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':').slice(0, -1).join(':')}:5000`
  : '';

// Try linkingUri (extract IP from exp://192.168.x.x:8081 or http://...)
const linkingUri = Constants.linkingUri || '';
const linkingMatch = linkingUri.match(/exp:\/\/([^:/]+)/) || linkingUri.match(/http:\/\/([^:/]+)/);
const linkingHostIp = linkingMatch ? linkingMatch[1] : '';
const linkingHost = linkingHostIp ? `http://${linkingHostIp}:5000` : '';

// Try debuggerHost fallback (Expo Go / manifest configs)
const debuggerHost = (Constants.manifest as any)?.debuggerHost || (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost || (Constants as any)?.expoGoConfig?.debuggerHost || '';
const debuggerHostIp = debuggerHost ? debuggerHost.split(':')[0] : '';
const debuggerHostUrl = debuggerHostIp ? `http://${debuggerHostIp}:5000` : '';

const isDev = typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : process.env.NODE_ENV !== 'production';

const candidateBases = (
  isDev
    ? [
        configuredUrl,
        expoHost,
        linkingHost,
        debuggerHostUrl,
        Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000',
        DEVELOPMENT_API_URL,
        PRODUCTION_API_URL,
      ]
    : [
        configuredUrl,
        PRODUCTION_API_URL,
        expoHost,
        linkingHost,
        debuggerHostUrl,
        DEVELOPMENT_API_URL,
        Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000',
      ]
).filter((value, index, self) => Boolean(value) && self.indexOf(value) === index) as string[];

let activeBaseUrl = candidateBases[0] || (isDev ? DEVELOPMENT_API_URL : PRODUCTION_API_URL);

export let API_BASE_URL = activeBaseUrl;
console.log('[API] Candidate Bases:', candidateBases);
export const API_BASE_URLS = candidateBases;
export const REQUEST_TIMEOUT_MS = 10000;

export const getApiBaseUrl = () => activeBaseUrl;

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  let lastError: unknown;
  const timeoutDuration = options.timeoutMs || REQUEST_TIMEOUT_MS;

  // Try the active/last-successful base URL first
  const orderedBases = [activeBaseUrl, ...API_BASE_URLS.filter(b => b !== activeBaseUrl)];

  for (const baseUrl of orderedBases) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const fullUrl = path.startsWith('http://') || path.startsWith('https://') 
        ? path 
        : `${baseUrl}${normalizedPath}`;

      const { timeoutMs, ...fetchOptions } = options;

      const isFormData = Boolean(
        fetchOptions.body && (
          fetchOptions.body instanceof FormData ||
          (typeof fetchOptions.body === 'object' && typeof (fetchOptions.body as any).append === 'function')
        )
      );

      console.log(`[API] Attempting ${options.method || 'GET'} ${path} on ${baseUrl} | Body type: ${isFormData ? 'FormData' : typeof fetchOptions.body}`);

      if (isFormData && fetchOptions.body) {
        console.log("=== [API DEBUG] FormData Request Inspection ===");
        console.log(`[API DEBUG] Method: ${options.method || 'GET'} | Path: ${path}`);
        console.log("[API DEBUG] isFormData:", true);
        const parts = (fetchOptions.body as any)._parts;
        if (Array.isArray(parts)) {
          console.log(`[API DEBUG] Total FormData Fields: ${parts.length}`);
          parts.forEach((part: any, idx: number) => {
            const fieldName = Array.isArray(part) ? part[0] : 'unknown';
            const value = Array.isArray(part) ? part[1] : part;
            const typeofValue = typeof value;
            const constructorName = value && value.constructor ? value.constructor.name : 'N/A';
            const isObject = typeofValue === 'object' && value !== null;
            const hasUri = isObject && typeof value.uri === 'string';
            const hasName = isObject && typeof value.name === 'string';
            const hasType = isObject && typeof value.type === 'string';
            const containsUriNameType = hasUri && hasName && hasType;

            console.log(`[API DEBUG] Field #${idx + 1} ["${fieldName}"]`);
            console.log(`  - typeof value: "${typeofValue}"`);
            console.log(`  - constructor name: "${constructorName}"`);
            console.log(`  - contains uri/name/type: ${containsUriNameType}`);
            if (isObject) {
              console.log(`  - media uri: "${value.uri || 'N/A'}"`);
              console.log(`  - media type: "${value.type || 'N/A'}"`);
              console.log(`  - media filename: "${value.name || 'N/A'}"`);
            } else {
              console.log(`  - text value: "${String(value).substring(0, 50)}"`);
            }

            if (isObject && !containsUriNameType) {
              console.error(`❌ [API DEBUG ERROR] Field "${fieldName}" is an object but lacks valid string uri/name/type!`, {
                value,
                constructorName,
              });
            }
          });
        } else {
          console.log("[API DEBUG] FormData._parts is not an array. Body:", fetchOptions.body);
        }
        console.log("===============================================");
      }

      const reqHeaders: Record<string, string> = {
        Accept: 'application/json',
        ...(fetchOptions.headers as Record<string, string> || {}),
      };

      if (isFormData) {
        delete reqHeaders['Content-Type'];
        delete reqHeaders['content-type'];
        delete reqHeaders['Content-type'];
      }

      // Preserve the exact FormData object passed in: do not convert, clone, serialize, spread, or transform it.
      const bodyToUse = fetchOptions.body;

      const response = await fetch(fullUrl, {
        ...fetchOptions,
        body: bodyToUse,
        signal: controller.signal,
        headers: reqHeaders,
      });

      clearTimeout(timeoutId);
      // Remember working base URL
      if (activeBaseUrl !== baseUrl) {
        activeBaseUrl = baseUrl;
        API_BASE_URL = baseUrl;
        console.log(`[API] Promoted working baseUrl to: ${baseUrl}`);
      }
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      console.log(`[API] Attempt failed on ${baseUrl}${path}:`, error?.message || error);
    }
  }

  if (lastError instanceof Error) {
    if (lastError.name === 'AbortError') {
      throw new Error('Connection timed out. Please verify the backend server is reachable.');
    }
    throw lastError;
  }

  throw new Error('Network request failed. Please check your connection.');
};

export interface HealthCheckResult {
  ok: boolean;
  status?: string;
  service?: string;
  url?: string;
  error?: string;
}

/**
 * Utility to verify API connectivity with GET /health
 */
export const checkApiHealth = async (): Promise<HealthCheckResult> => {
  try {
    const response = await apiFetch('/health', { method: 'GET', timeoutMs: 5000 });
    if (response.ok) {
      const data = await response.json();
      return {
        ok: true,
        status: data.status,
        service: data.service,
        url: getApiBaseUrl(),
      };
    }
    return {
      ok: false,
      url: getApiBaseUrl(),
      error: `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      url: getApiBaseUrl(),
      error: error?.message || 'Health check failed',
    };
  }
};


