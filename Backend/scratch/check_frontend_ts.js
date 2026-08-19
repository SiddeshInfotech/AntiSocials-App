const path = require('path');
const projectRoot = path.join(__dirname, '..', '..');
const tsPath = path.join(projectRoot, 'Frontend', 'node_modules', 'typescript');
let ts;
try {
  ts = require(tsPath);
} catch (e) {
  console.log('Trying fallback require(typescript)');
  ts = require('typescript');
}

const files = [
  path.join(projectRoot, 'Frontend', 'constants', 'ImageUtils.ts'),
  path.join(projectRoot, 'Frontend', 'app', '(tabs)', 'stories.tsx'),
  path.join(projectRoot, 'Frontend', 'components', 'StoryCard.tsx'),
  path.join(projectRoot, 'Frontend', 'app', '(tabs)', 'index.tsx')
];

const program = ts.createProgram(files, {
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  skipLibCheck: true
});

const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => {
  if (!d.file) return false;
  return files.some(f => path.normalize(d.file.fileName) === path.normalize(f));
});

console.log('Diagnostic errors count:', diagnostics.length);
diagnostics.forEach(d => {
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  const file = d.file ? d.file.fileName : 'unknown';
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  console.log(`${file} (${line + 1},${character + 1}): ${message}`);
});
