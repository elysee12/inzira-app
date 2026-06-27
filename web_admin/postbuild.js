import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('📦 Copying static assets to dist directory...');

// Ensure dist directory exists
if (!existsSync('.output/public')) {
  console.error('❌ Error: .output/public directory not found');
  process.exit(1);
}

// Remove existing dist if it exists
if (existsSync('dist')) {
  console.log('🗑️  Removing old dist directory...');
  cpSync('dist', 'dist-backup', { recursive: true, force: true });
}

// Copy .output/public to dist
console.log('📋 Copying .output/public to dist...');
cpSync('.output/public', 'dist', { recursive: true, force: true });

console.log('✅ Build complete! Static files are in dist/ directory');
console.log('📁 Files ready for deployment to Render');
