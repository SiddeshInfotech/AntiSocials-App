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
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

export function resolveImageUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return fallback;

  const cleanUrl = url.trim();

  // Local file URI (from camera or image picker before upload)
  if (cleanUrl.startsWith('file://') || cleanUrl.startsWith('data:image')) return cleanUrl;

  // Check if URL points to an uploaded image resource (/uploads/...)
  const uploadsIndex = cleanUrl.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = cleanUrl.substring(uploadsIndex);
    return `${API_BASE_URL}${relativePath}`;
  }

  // Already a valid HTTPS external image URL
  if (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) {
    return cleanUrl;
  }

  // Relative path without leading slash
  if (cleanUrl.startsWith('uploads/')) {
    return `${API_BASE_URL}/${cleanUrl}`;
  }

  return cleanUrl;
}
