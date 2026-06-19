import sharp from 'sharp';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';

const INPUT_DIR = 'projects/neomatten-app/src/assets/images';
const QUALITY = 85;

// Exclude these folders entirely
const EXCLUDE_DIRS = ['icons'];

// Extensions to process
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.tiff'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip excluded folders
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      files.push(...(await walk(fullPath)));
    } else if (IMAGE_EXTS.includes(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimise(filePath) {
  const webpPath = filePath.replace(/\.(png|jpg|jpeg|gif|tiff)$/i, '.webp');

  try {
    const original = await stat(filePath);
    const info = await sharp(filePath).webp({ quality: QUALITY }).toFile(webpPath);

    await unlink(filePath); // delete original only after a successful conversion

    const saved = original.size - info.size;
    const pct = ((saved / original.size) * 100).toFixed(1);
    console.log(
      `✅ ${basename(filePath)} → ${basename(webpPath)} | ${(original.size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB (-${pct}%) 🗑`
    );
  } catch (err) {
    console.error(`❌ ${filePath}:`, err.message);
    // Do NOT delete original if conversion failed.
  }
}

const files = await walk(INPUT_DIR);
console.log(`Found ${files.length} images to optimise (excluding: ${EXCLUDE_DIRS.join(', ')})\n`);
await Promise.all(files.map(optimise));
console.log('\nDone. Original files kept as PNG/JPG fallbacks.');
