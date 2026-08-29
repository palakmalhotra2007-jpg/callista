/**
 * Copies the Vite build output (dist/) into public/ so Vercel can serve
 * the React SPA as static assets from its CDN.
 * Runs automatically as part of: npm run vercel-build
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const src = path.join(root, 'dist');
const dest = path.join(root, 'public');

if (!fs.existsSync(src)) {
  console.error('❌ dist/ not found — did vite build succeed?');
  process.exit(1);
}

// Wipe existing public/ so stale files don't linger between deployments
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

copyDir(src, dest);
console.log('✅ Copied dist/ → public/');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath  = path.join(from, entry.name);
    const destPath = path.join(to,   entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
