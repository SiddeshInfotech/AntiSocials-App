const fs = require('fs');
const path = require('path');

const frontendAppDir = path.join(__dirname, '..', '..', 'Frontend', 'app');

const files = fs.readdirSync(frontendAppDir);

let updatedCount = 0;

for (const file of files) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    const fullPath = path.join(frontendAppDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // Check if file has fetch(`${API_BASE_URL}/api/tasks/complete` or similar
    if (content.includes('${API_BASE_URL}/api/tasks/complete')) {
        // Replace fetch(`${API_BASE_URL}/api/tasks/complete` with apiFetch('/api/tasks/complete'
        content = content.replace(/fetch\s*\(\s*`\$\{API_BASE_URL\}\/api\/tasks\/complete`\s*,/g, "apiFetch('/api/tasks/complete',");
        content = content.replace(/fetch\s*\(\s*`\$\{API_BASE_URL\}\/api\/tasks\/complete`\s*\)/g, "apiFetch('/api/tasks/complete')");
        changed = true;
    }

    if (content.includes('apiFetch(') && !content.includes('apiFetch')) {
        // shouldn't happen
    }

    if (changed) {
        // Ensure apiFetch is imported
        if (!content.includes('apiFetch')) {
            if (content.includes("from '../constants/Api'") || content.includes('from "../constants/Api"')) {
                content = content.replace(/import\s*\{\s*API_BASE_URL\s*\}\s*from\s*(['"])(\.\.\/constants\/Api)\1;?/, "import { apiFetch, API_BASE_URL } from $1$2$1;");
            } else if (content.includes("from './constants/Api'") || content.includes('from "./constants/Api"')) {
                content = content.replace(/import\s*\{\s*API_BASE_URL\s*\}\s*from\s*(['"])(\.\/constants\/Api)\1;?/, "import { apiFetch, API_BASE_URL } from $1$2$1;");
            } else {
                content = `import { apiFetch } from '../constants/Api';\n` + content;
            }
        } else if (content.includes('apiFetch') && (content.includes("import { API_BASE_URL } from '../constants/Api'") || content.includes('import { API_BASE_URL } from "../constants/Api"'))) {
            content = content.replace(/import\s*\{\s*API_BASE_URL\s*\}\s*from\s*(['"])(\.\.\/constants\/Api)\1;?/, "import { apiFetch, API_BASE_URL } from $1$2$1;");
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        updatedCount++;
        console.log(`Updated: ${file}`);
    }
}

console.log(`\nSuccessfully updated ${updatedCount} task screen files to use apiFetch.`);
