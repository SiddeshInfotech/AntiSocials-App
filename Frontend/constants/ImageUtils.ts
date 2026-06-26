import { API_BASE_URL } from './Api';

/**
 * Resolves an image URL from the database into a fully-qualified URL.
 * 
 * Handles three cases:
 * 1. Relative path (new format): "/uploads/profile_123.png" → "http://<API_BASE_URL>/uploads/profile_123.png"
 * 2. Old absolute URL with stale IP: "http://192.168.1.8:5000/uploads/..." → "http://<API_BASE_URL>/uploads/..."
 * 3. External URL (https://cdn...): returned as-is
 * 4. null/undefined/empty: returns the fallback
 */
const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

export function resolveImageUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  if (!url || url.trim() === '') return fallback;

  // Already a full external URL (not pointing to our backend)
  if (url.startsWith('https://') && !url.includes('/uploads/')) return url;

  // Local file URI (from image picker preview, not yet uploaded)
  if (url.startsWith('file://') || url.startsWith('data:image')) return url;

  // Relative path (new format): prepend API_BASE_URL
  if (url.startsWith('/uploads/')) {
    return `${API_BASE_URL}${url}`;
  }

  // Old absolute URL with hardcoded IP: extract the relative path and rebuild
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = url.substring(uploadsIndex);
    return `${API_BASE_URL}${relativePath}`;
  }

  // Fallback: return as-is
  return url;
}
