import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distIndexPath = join(projectRoot, 'dist', 'index.js');

if (!existsSync(distIndexPath)) {
  console.error('ERROR: dist/index.js not found.');
  console.error('Please run "npm run build" first to create the production build.');
  process.exit(1);
}

console.log('✓ dist/index.js found, starting server...');

