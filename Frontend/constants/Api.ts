import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_BASE_URL ? process.env.EXPO_PUBLIC_API_BASE_URL : '').trim();

// Try hostUri (Expo CLI host)
const expoHost = Constants.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':').slice(0, -1).join(':')}:5000`
  : '';

// Try linkingUri (extract IP from exp://192.168.x.x:8081)
const linkingUri = Constants.linkingUri || '';
const linkingMatch = linkingUri.match(/exp:\/\/([^:/]+)/) || linkingUri.match(/http:\/\/([^:/]+)/);
const linkingHostIp = linkingMatch ? linkingMatch[1] : '';
const linkingHost = linkingHostIp ? `http://${linkingHostIp}:5000` : '';

// Try debuggerHost fallback (older or alternative Expo configs)
const debuggerHost = (Constants.manifest as any)?.debuggerHost || (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost || '';
const debuggerHostIp = debuggerHost ? debuggerHost.split(':')[0] : '';
const debuggerHostUrl = debuggerHostIp ? `http://${debuggerHostIp}:5000` : '';

const candidateBases = [
  configuredUrl,
  'http://192.168.1.102:5000', // Host Wi-Fi local IP
  expoHost,
  linkingHost,
  debuggerHostUrl,
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://127.0.0.1:5000',
  'http://192.168.1.105:5000', // legacy fallback
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter((value, index, self) => Boolean(value) && self.indexOf(value) === index) as string[];

export const API_BASE_URL = candidateBases[0] || 'http://10.0.2.2:5000';
console.log('[API] Candidate Bases:', candidateBases);
export const API_BASE_URLS = candidateBases;
export const REQUEST_TIMEOUT_MS = 8000;

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  let lastError: unknown;

  for (const baseUrl of API_BASE_URLS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      console.log(`[API] Attempting ${path} on ${baseUrl}`);
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error('Request timed out');
  }

  throw lastError instanceof Error ? lastError : new Error('Request timed out');
};
