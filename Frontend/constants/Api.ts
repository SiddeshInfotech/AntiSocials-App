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

/**
 * Executes a multipart/form-data upload using React Native's native XMLHttpRequest network layer.
 * This streams files directly via OkHttp / NSURLSession without buffering them in JS RAM
 * and avoids Expo Winter's "Unsupported FormDataPart implementation" error in global fetch.
 */
function xhrFormDataFetch(
  fullUrl: string,
  method: string,
  reqHeaders: Record<string, string>,
  body: any,
  timeoutDuration: number,
  signal?: AbortSignal,
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    console.log(`📡 [XHR START] Initiating upload:`, {
      url: fullUrl,
      method: method || 'POST',
      timeoutMs: timeoutDuration,
      headerKeys: Object.keys(reqHeaders),
    });

    const xhr = new XMLHttpRequest();
    xhr.open(method || 'POST', fullUrl);
    xhr.timeout = timeoutDuration;

    Object.entries(reqHeaders).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        try {
          xhr.setRequestHeader(key, String(val));
        } catch (_) {}
      }
    });

    let settled = false;

    if (xhr.upload) {
      xhr.upload.onprogress = (event: any) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.round((event.loaded / event.total) * 100);
          console.log(`📊 [XHR PROGRESS] ${fullUrl}: ${pct}% (${event.loaded}/${event.total} bytes)`);
        }
      };
    }

    const onAbort = () => {
      if (!settled) {
        settled = true;
        console.warn(`🛑 [XHR ABORT] Request aborted: ${fullUrl}`);
        try {
          xhr.abort();
        } catch (_) {}
        const err = new Error('Aborted');
        err.name = 'AbortError';
        reject(err);
      }
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort);
    }

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      if (signal) {
        try {
          signal.removeEventListener('abort', onAbort);
        } catch (_) {}
      }

      console.log(`✅ [XHR LOAD] ${method || 'POST'} ${fullUrl}`, {
        status: xhr.status,
        statusText: xhr.statusText,
        readyState: xhr.readyState,
        responseLength: xhr.responseText?.length || 0,
      });

      const responseHeaders = new Headers();
      const rawHeaders = xhr.getAllResponseHeaders() || '';
      rawHeaders
        .trim()
        .split(/[\r\n]+/)
        .forEach((line) => {
          const parts = line.split(': ');
          const header = parts.shift();
          const value = parts.join(': ');
          if (header) {
            try {
              responseHeaders.append(header.trim(), value.trim());
            } catch (_) {}
          }
        });

      const responseText =
        xhr.response !== undefined && typeof xhr.response === 'string'
          ? xhr.response
          : xhr.responseText || '';

      const status =
        xhr.status >= 200 && xhr.status <= 599 ? xhr.status : 200;

      let responseObj: Response;
      try {
        responseObj = new Response(responseText, {
          status,
          statusText: xhr.statusText || '',
          headers: responseHeaders,
        });
      } catch (_) {
        responseObj = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText || '',
          headers: responseHeaders,
          url: fullUrl,
          text: async () => responseText,
          json: async () => JSON.parse(responseText),
          blob: async () => new Blob([responseText]),
          clone: () => responseObj,
        } as any;
      }

      resolve(responseObj);
    };

    xhr.onerror = (event: any) => {
      if (settled) return;
      settled = true;
      if (signal) {
        try {
          signal.removeEventListener('abort', onAbort);
        } catch (_) {}
      }

      console.error(`❌ [XHR ERROR] on ${method || 'POST'} ${fullUrl}:`, {
        readyState: xhr.readyState,
        status: xhr.status,
        statusText: xhr.statusText || 'None',
        timeout: xhr.timeout,
        eventType: event?.type || 'error',
      });

      reject(new TypeError(`Network request failed on ${fullUrl}`));
    };

    xhr.ontimeout = () => {
      if (settled) return;
      settled = true;
      if (signal) {
        try {
          signal.removeEventListener('abort', onAbort);
        } catch (_) {}
      }

      console.error(`⏰ [XHR TIMEOUT] on ${method || 'POST'} ${fullUrl}:`, {
        timeoutMs: timeoutDuration,
        readyState: xhr.readyState,
        status: xhr.status,
      });

      const err = new Error(`Request timed out after ${timeoutDuration}ms`);
      err.name = 'TimeoutError';
      reject(err);
    };

    xhr.send(body);
  });
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
              const uriScheme = hasUri ? (value.uri.split(':')[0] || 'unknown') : 'N/A';
              console.log(`  - media uri scheme: "${uriScheme}" | uri: "${value.uri || 'N/A'}"`);
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

      let response: Response;
      if (isFormData && Platform.OS !== 'web' && typeof XMLHttpRequest !== 'undefined') {
        console.log(`[API] Using native XMLHttpRequest multipart streaming for ${options.method || 'POST'} ${path}`);
        response = await xhrFormDataFetch(
          fullUrl,
          options.method || 'POST',
          reqHeaders,
          bodyToUse,
          timeoutDuration,
          controller.signal,
        );
      } else {
        response = await fetch(fullUrl, {
          ...fetchOptions,
          body: bodyToUse,
          signal: controller.signal,
          headers: reqHeaders,
        });
      }

      // If gateway or proxy returned 502, 503, 504 (e.g. Render "Service Suspended" or Bad Gateway HTML),
      // this host is unavailable; treat as attempt failure so next candidate base URL is tried.
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error(`Host ${baseUrl} returned HTTP ${response.status} (Service Unavailable/Suspended)`);
      }

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


