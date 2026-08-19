const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, '..', 'assets', 'images', 'default_avatar.png');
const base64 = fs.readFileSync(imagePath).toString('base64');
const tsContent = `// Default Instagram-style avatar Base64 Data URI (zero network latency, offline ready)\nexport const DEFAULT_AVATAR_BASE64 = 'data:image/jpeg;base64,${base64}';\n`;

const targetPath = path.join(__dirname, '..', 'constants', 'defaultAvatarBase64.ts');
fs.writeFileSync(targetPath, tsContent, 'utf8');
console.log('Successfully wrote defaultAvatarBase64.ts. Length:', tsContent.length);
