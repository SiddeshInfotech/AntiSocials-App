import { API_BASE_URL, getApiBaseUrl } from './Api';

/**
 * Resolves an image/video URL from the database or local picker into a fully-qualified URL.
 * 
 * Handles cases:
 * 1. Relative path: "/uploads/story_123.jpg" → "http://<API_BASE_URL>/uploads/story_123.jpg"
 * 2. Windows paths: "\\uploads\\story_123.jpg" or "uploads\\story_123.jpg" → "http://<API_BASE_URL>/uploads/story_123.jpg"
 * 3. Old absolute URL with stale/emulator IP: "http://10.0.2.2:5000/uploads/..." → "http://<API_BASE_URL>/uploads/..."
 * 4. Local file URIs: "file://...", "data:image...", "data:video...", "content://..."
 * 5. External URL (https://...): returned as-is
 * 6. null/undefined/empty: returns fallback
 */
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

export function resolveImageUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return fallback;

  // Normalize backslashes (Windows filesystem compatibility)
  let cleanUrl = url.trim().replace(/\\/g, '/');

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

  const rawBase = (getApiBaseUrl() || API_BASE_URL || '').trim();
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

  // If cleanUrl is an absolute URL pointing to localhost/127.0.0.1/10.0.2.2 with a path
  if (cleanUrl.match(/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?(\/.*)?$/)) {
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

  return cleanUrl;
}

