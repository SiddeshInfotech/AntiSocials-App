import { API_BASE_URL, getApiBaseUrl } from './Api';
import { DEFAULT_AVATAR_BASE64 } from './defaultAvatarBase64';

/**
 * Default Instagram-style avatar (Neutral grey circular silhouette).
 * Base64 data URI enables 100% offline support, instant rendering, and zero broken image states.
 */
export const DEFAULT_AVATAR = DEFAULT_AVATAR_BASE64;

/**
 * Resolves an image/video URL from the database or local picker into a fully-qualified URL.
 * 
 * Handles cases:
 * 1. Relative path: "/uploads/story_123.jpg" → "http://<API_BASE_URL>/uploads/story_123.jpg"
 * 2. Windows paths: "\\uploads\\story_123.jpg" or "uploads\\story_123.jpg" → "http://<API_BASE_URL>/uploads/story_123.jpg"
 * 3. Old absolute URL with stale/emulator IP: "http://10.0.2.2:5000/uploads/..." → "http://<API_BASE_URL>/uploads/..."
 * 4. Local file URIs: "file://...", "data:image...", "data:video...", "content://..."
 * 5. External URL (https://...): returned as-is
 * 6. null/undefined/empty: returns fallback (Instagram default avatar)
 */
export function resolveImageUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (
    trimmed === '' || 
    trimmed.toLowerCase() === 'null' || 
    trimmed.toLowerCase() === 'undefined' || 
    trimmed.toLowerCase() === 'nan' ||
    trimmed === '[object Object]'
  ) {
    return fallback;
  }

  // Normalize backslashes (Windows filesystem compatibility)
  let cleanUrl = trimmed.replace(/\\/g, '/');

  // Check if string ends with /null or /undefined (e.g. /uploads/null)
  const lower = cleanUrl.toLowerCase();
  if (lower.endsWith('/null') || lower.endsWith('/undefined') || lower === 'uploads/' || lower === '/uploads/') {
    return fallback;
  }

  // Local file / data / blob URIs from image picker or camera
  if (
    cleanUrl.startsWith('file://') ||
    cleanUrl.startsWith('data:image') ||
    cleanUrl.startsWith('data:video') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('content://') ||
    cleanUrl.startsWith('ph://')
  ) {
    return cleanUrl;
  }

  const rawBase = (getApiBaseUrl() || API_BASE_URL || 'http://localhost:5000').trim();
  const currentBase = rawBase.replace(/\/+$/, ''); // Strip trailing slash to avoid double-slash

  // Check if URL points to an uploaded resource (/uploads/...) anywhere in the string
  const uploadsIndex = cleanUrl.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = cleanUrl.substring(uploadsIndex);
    return `${currentBase}${relativePath}`;
  }

  // Relative path without leading slash (e.g. "uploads/story_123.jpg")
  if (cleanUrl.startsWith('uploads/')) {
    return `${currentBase}/${cleanUrl}`;
  }

  // If cleanUrl is an absolute URL pointing to localhost/127.0.0.1/10.0.2.2 or any LAN IP with a path
  if (cleanUrl.match(/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|\d+\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/)) {
    const match = cleanUrl.match(/^https?:\/\/[^/]+(\/.*)$/);
    if (match && match[1]) {
      return `${currentBase}${match[1]}`;
    }
  }

  // Already a valid external HTTP/HTTPS URL
  if (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) {
    return cleanUrl;
  }

  // Any other relative path starting with '/'
  if (cleanUrl.startsWith('/')) {
    return `${currentBase}${cleanUrl}`;
  }

  return `${currentBase}/${cleanUrl}`;
}

/**
 * Resolves a user profile avatar image URL, always defaulting to the Instagram-style fallback.
 */
export function resolveAvatarUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  return resolveImageUrl(url, fallback);
}

/**
 * Resolves a story media URL (image or video) from the database into a fully-qualified URL.
 * Returns null if the URL is empty, missing, or invalid.
 * Never returns default avatar so stories can display accurate media states.
 */
export function resolveStoryMediaUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (
    trimmed === '' || 
    trimmed.toLowerCase() === 'null' || 
    trimmed.toLowerCase() === 'undefined' || 
    trimmed.toLowerCase() === 'nan' ||
    trimmed === '[object Object]'
  ) {
    return null;
  }

  // Normalize backslashes (Windows filesystem compatibility)
  let cleanUrl = trimmed.replace(/\\/g, '/');

  const lower = cleanUrl.toLowerCase();
  if (lower.endsWith('/null') || lower.endsWith('/undefined') || lower === 'uploads/' || lower === '/uploads/') {
    return null;
  }

  // Local file / data / blob URIs from image picker or camera
  if (
    cleanUrl.startsWith('file://') ||
    cleanUrl.startsWith('data:image') ||
    cleanUrl.startsWith('data:video') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('content://') ||
    cleanUrl.startsWith('ph://')
  ) {
    return cleanUrl;
  }

  const rawBase = (getApiBaseUrl() || API_BASE_URL || 'http://localhost:5000').trim();
  const currentBase = rawBase.replace(/\/+$/, '');

  // Check if URL points to an uploaded resource (/uploads/...) anywhere in the string
  const uploadsIndex = cleanUrl.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = cleanUrl.substring(uploadsIndex);
    return `${currentBase}${relativePath}`;
  }

  // Relative path without leading slash (e.g. "uploads/story_123.jpg")
  if (cleanUrl.startsWith('uploads/')) {
    return `${currentBase}/${cleanUrl}`;
  }

  // Rewrite legacy absolute URLs with stale IP / localhost to current active backend
  if (cleanUrl.match(/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|\d+\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/)) {
    const match = cleanUrl.match(/^https?:\/\/[^/]+(\/.*)$/);
    if (match && match[1]) {
      return `${currentBase}${match[1]}`;
    }
  }

  // Already a valid external HTTP/HTTPS URL
  if (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) {
    return cleanUrl;
  }

  // Any other relative path starting with '/'
  if (cleanUrl.startsWith('/')) {
    return `${currentBase}${cleanUrl}`;
  }

  return `${currentBase}/${cleanUrl}`;
}
