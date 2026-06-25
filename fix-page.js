const fs = require('fs');
const content = fs.readFileSync('f:/Project/fabricviz/apps/web/src/app/admin/(protected)/homepage/page.tsx', 'utf8');
const lines = content.split('\n');
const fixedLines = lines.slice(0, 1172);
const testimonialsCode = fs.readFileSync('f:/Project/fabricviz/TestimonialsEditor.tsx', 'utf8');
fs.writeFileSync('f:/Project/fabricviz/apps/web/src/app/admin/(protected)/homepage/page.tsx', fixedLines.join('\n') + '\n\n' + testimonialsCode);
