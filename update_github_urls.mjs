/**
 * Mijenja lokalne image URL-ove u mushrooms.ts na GitHub raw URL-ove.
 * Pokrenuti NAKON što se slike pushaju na GitHub.
 */
import fs from 'fs';

const GITHUB_BASE = 'https://raw.githubusercontent.com/DBrka/Mushroom-App/main';
const MUSHROOMS_TS = './src/data/mushrooms.ts';

let content = fs.readFileSync(MUSHROOMS_TS, 'utf-8');

// Zamijeni sve '/mushrooms/...' sa GitHub raw URL-om
const before = content;
content = content.replace(
  /(['"])(\/mushrooms\/[^'"]+)(['"])/g,
  (_, q1, path, q2) => `${q1}${GITHUB_BASE}/public${path}${q2}`
);

// Zamijeni imgs() helper funkciju da koristi GitHub URL-ove
content = content.replace(
  /const imgs = \(id: number, n = 8\): string\[\] =>\s*Array\.from\(\{ length: n \}, \(_,\s*i\) => `\/mushrooms\/m\$\{id\}_\$\{String\(i \+ 1\)\.padStart\(2,\s*'0'\)\}\.jpg`\);/,
  `const GITHUB_BASE = '${GITHUB_BASE}/public';\nconst imgs = (id: number, n = 8): string[] =>\n  Array.from({ length: n }, (_, i) => \`\${GITHUB_BASE}/mushrooms/m\${id}_\${String(i + 1).padStart(2, '0')}.jpg\`);`
);

if (content === before) {
  console.log('⚠ Nisu pronađeni lokalni URL-ovi za zamjenu. Možda su već GitHub URL-ovi?');
} else {
  fs.writeFileSync(MUSHROOMS_TS, content, 'utf-8');
  console.log('✓ mushrooms.ts updateovan sa GitHub URL-ovima');
}
