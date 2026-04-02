const fs = require('fs');

const path = 'app/(tabs)/index.tsx';
let code = fs.readFileSync(path, 'utf8');

function removeBetween(startStr, endStr) {
  const start = code.indexOf(startStr);
  if (start === -1) return;
  const end = code.indexOf(endStr, start);
  if (end === -1) return;
  code = code.substring(0, start) + code.substring(end + endStr.length);
}

// 1. Remove DOMAINS
removeBetween('const DOMAINS = [', '];\r\n');

// 2. Remove InteractiveDomainItem
removeBetween('const InteractiveDomainItem = ({', '};\r\n');

// 3. Remove AnimatedOwl
removeBetween('const AnimatedOwl = () => {', '  );\r\n};\r\n');

// 4. Remove activeDomain state
removeBetween('const [activeDomain, setActiveDomain]', 'null);\r\n');

// 5. Remove handleDomainPress
removeBetween('const handleDomainPress = (name: string) => {', '  };\r\n');

// 6. Remove SVG CHART SECTION
removeBetween('{/* --- NEW BEAUTIFUL SVG LIFE DOMAINS CHART SECTION --- */}', '          </View>\r\n        </View>\r\n');

fs.writeFileSync(path, code);
console.log('Done!');
