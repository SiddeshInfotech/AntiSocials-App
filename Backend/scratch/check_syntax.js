const fs = require('fs');
const path = require('path');

const filesToCheck = [
  '../controllers/profileController.js',
  '../routes/profileRoutes.js',
  '../index.js'
];

let hasError = false;

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(__dirname, relPath);
  try {
    require(fullPath);
    console.log(`✅ [OK] Syntax valid for ${relPath}`);
  } catch (err) {
    console.error(`❌ [ERROR] Syntax/Require error in ${relPath}:`, err.message);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log("All backend files passed syntax check!");
}
