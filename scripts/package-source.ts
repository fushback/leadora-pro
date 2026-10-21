import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'www',
  '.git',
  '.cache',
  '.idea',
  '.vscode'
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.apk'
]);

function shouldIncludeFile(relPath: string, filename: string): boolean {
  if (filename.startsWith('.') && filename !== '.env.example' && filename !== '.gitignore' && filename !== '.github') {
    return false;
  }
  const ext = path.extname(filename).toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(ext)) {
    return false;
  }
  if (relPath.includes('public/downloads') && (ext === '.zip' || ext === '.apk')) {
    return false;
  }
  return true;
}

function addDirectoryToZip(currentDir: string, zipFolder: JSZip, baseRel = '') {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = baseRel ? `${baseRel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      const nextFolder = zipFolder.folder(entry.name);
      if (nextFolder) {
        addDirectoryToZip(fullPath, nextFolder, relPath);
      }
    } else if (entry.isFile()) {
      if (shouldIncludeFile(relPath, entry.name)) {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, content);
      }
    }
  }
}

async function createSourceZip() {
  console.log('Generating complete project source code ZIP (without build artifacts)...');
  const zip = new JSZip();

  addDirectoryToZip(rootDir, zip);

  const outDir = path.resolve(rootDir, 'public', 'downloads');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const targetPath = path.join(outDir, 'b2b-lead-pro-source-code.zip');
  fs.writeFileSync(targetPath, zipBuffer);
  console.log(`Pristine source package created at: ${targetPath} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
}

createSourceZip().catch(console.error);
