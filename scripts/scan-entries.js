import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..', 'src');
const groups = ['elements', 'pages', 'themes'];
const entries = { js: {}, html: {} };

for (const group of groups) {
  const groupDir = path.join(root, group);
  if (!fs.existsSync(groupDir)) continue;
  const items = fs.readdirSync(groupDir);
  for (const name of items) {
    const folder = path.join(groupDir, name);
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) continue;

    const jsEntry = path.join(folder, 'index.tsx');

    const key = `${group}/${name}`;
    if (fs.existsSync(jsEntry)) {
      entries.js[key] = jsEntry;
      // 不再扫描实际的 HTML 文件，而是使用虚拟路径
      // 开发服务器会通过中间件拦截并使用统一模板
      entries.html[key] = path.join(folder, 'index.html');
    }
  }
}

fs.writeFileSync(path.resolve(__dirname, '..', 'entries.json'), JSON.stringify(entries, null, 2), 'utf8');
console.log('Generated entries.json with', Object.keys(entries.js).length, 'js entries and', Object.keys(entries.html).length, 'html entries (using unified template)');
