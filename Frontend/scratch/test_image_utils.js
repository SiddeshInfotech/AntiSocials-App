const fs = require('fs');
const path = require('path');

const base64File = path.join(__dirname, '..', 'constants', 'defaultAvatarBase64.ts');
const fileText = fs.readFileSync(base64File, 'utf8');
const match = fileText.match(/DEFAULT_AVATAR_BASE64\s*=\s*'([^']+)'/);
const DEFAULT_AVATAR = match ? match[1] : '';

function resolveImageUrl(url, fallback = DEFAULT_AVATAR) {
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

  let cleanUrl = trimmed.replace(/\\/g, '/');
  const lower = cleanUrl.toLowerCase();
  if (lower.endsWith('/null') || lower.endsWith('/undefined') || lower === 'uploads/' || lower === '/uploads/') {
    return fallback;
  }

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

  const currentBase = 'http://localhost:5000';
  const uploadsIndex = cleanUrl.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = cleanUrl.substring(uploadsIndex);
    return `${currentBase}${relativePath}`;
  }

  if (cleanUrl.startsWith('uploads/')) {
    return `${currentBase}/${cleanUrl}`;
  }

  if (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return `${currentBase}${cleanUrl}`;
  }

  return cleanUrl;
}

const testCases = [
  { input: null, expected: DEFAULT_AVATAR, label: 'null' },
  { input: undefined, expected: DEFAULT_AVATAR, label: 'undefined' },
  { input: '', expected: DEFAULT_AVATAR, label: 'empty string' },
  { input: '   ', expected: DEFAULT_AVATAR, label: 'whitespace' },
  { input: 'null', expected: DEFAULT_AVATAR, label: 'string "null"' },
  { input: 'undefined', expected: DEFAULT_AVATAR, label: 'string "undefined"' },
  { input: '/uploads/null', expected: DEFAULT_AVATAR, label: 'relative /uploads/null' },
  { input: 'uploads/undefined', expected: DEFAULT_AVATAR, label: 'relative uploads/undefined' },
  { input: '/uploads/profile_123.jpg', expected: 'http://localhost:5000/uploads/profile_123.jpg', label: 'valid uploaded image' },
  { input: 'https://example.com/avatar.jpg', expected: 'https://example.com/avatar.jpg', label: 'remote https avatar' },
  { input: 'file:///var/mobile/Containers/photo.jpg', expected: 'file:///var/mobile/Containers/photo.jpg', label: 'local picker file URI' },
];

let passed = 0;
for (const tc of testCases) {
  const res = resolveImageUrl(tc.input);
  if (res === tc.expected) {
    console.log(`✅ [PASS] ${tc.label}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${tc.label}: expected "${tc.expected.slice(0, 30)}...", got "${res.slice(0, 30)}..."`);
  }
}

console.log(`\nResult: ${passed}/${testCases.length} tests passed.`);
if (passed === testCases.length) {
  console.log('🎉 All ImageUtils tests passed successfully!');
} else {
  process.exit(1);
}
