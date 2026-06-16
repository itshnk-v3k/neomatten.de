/*
 * Generates the PWA / favicon icon set from the NM logo into src/assets/icons.
 * Run: node scripts/generate-icons.mjs  (sharp is a devDependency)
 * The source mark is centred on a transparent canvas (fit: contain) at each size.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SOURCE = 'src/assets/logo/neomat_nm_transparent.png';
const OUT_DIR = 'src/assets/icons';
const sizes = [16, 32, 64, 96, 128, 144, 152, 180, 310, 512];

mkdirSync(OUT_DIR, { recursive: true });

for (const size of sizes) {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(`${OUT_DIR}/icon-${size}x${size}.png`);
  console.log(`Generated ${size}x${size}`);
}
