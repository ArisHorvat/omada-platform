const fs = require('fs');
const path = require('path');

// CONFIG: folders/files to ignore
const IGNORE_PATTERNS = [
  'node_modules', '.git', '.expo', 'dist', 'build', 
  'package-lock.json', 'yarn.lock', 'assets', '.png', '.jpg',
  'bin', 'obj', '.vs' // <--- Added these to ignore .NET junk
];

// CONFIG: Extensions to include
const INCLUDE_EXTS = [
  '.ts', '.tsx', '.js', '.json', '.css', 
  '.cs', '.csproj', '.xml' // <--- Added these for your ASP.NET Backend
];

const outputFile = 'full_project_context.txt';
let output = '';

function traverseDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (IGNORE_PATTERNS.some(pattern => fullPath.includes(pattern))) return;

    if (stat.isDirectory()) {
      traverseDir(fullPath);
    } else {
      if (INCLUDE_EXTS.includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        output += `\n\n--- START OF FILE: ${fullPath} ---\n`;
        output += content;
        output += `\n--- END OF FILE: ${fullPath} ---\n`;
      }
    }
  });
}

console.log('Collecting code...');
traverseDir(__dirname);
fs.writeFileSync(outputFile, output);
console.log(`Done! Upload the file "${outputFile}" to the chat.`);