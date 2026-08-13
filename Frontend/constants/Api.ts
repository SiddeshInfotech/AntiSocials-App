import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_BASE_URL ? process.env.EXPO_PUBLIC_API_BASE_URL : '').trim();

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

const candidateBases = [
  configuredUrl,
  expoHost,
  linkingHost,
  debuggerHostUrl,
  'http://192.168.1.103:5000',
  'http://192.168.1.5:5000',
  'http://192.168.1.102:5000',
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000',
  'http://10.0.2.2:5000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter((value, index, self) => Boolean(value) && self.indexOf(value) === index) as string[];

let activeBaseUrl = candidateBases[0] || (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000');

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

      console.log(`[API] Attempting ${options.method || 'GET'} ${path} on ${baseUrl}`);
      const { timeoutMs, ...fetchOptions } = options;
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {}),
        },
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

