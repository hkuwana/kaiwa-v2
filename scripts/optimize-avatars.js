import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputDir = path.join(__dirname, '../src/lib/assets/speakers');
const outputDir = path.join(__dirname, '../static/speakers');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all image files
const files = fs
  .readdirSync(inputDir)
  .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

if (files.length === 0) {
  console.log('No images found in', inputDir);
  process.exit(0);
}

console.log(`\n📦 Compressing ${files.length} speaker avatars...\n`);

let totalOriginal = 0;
let totalCompressed = 0;

Promise.all(
  files.map(async (file) => {
    const filename = path.parse(file).name;
    const inputPath = path.join(inputDir, file);
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    totalOriginal += originalSize;

    try {
      // Create WebP version (primary format - best compression)
      const webpPath = path.join(outputDir, `${filename}.webp`);
      await sharp(inputPath)
        .resize(200, 200, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      const webpSize = webpStats.size;

      // Create JPEG fallback
      const jpgPath = path.join(outputDir, `${filename}.jpg`);
      await sharp(inputPath)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80, progressive: true })
        .toFile(jpgPath);

      const jpgStats = fs.statSync(jpgPath);
      const jpgSize = jpgStats.size;

      totalCompressed += webpSize + jpgSize;

      const reduction = ((1 - (webpSize + jpgSize) / originalSize) * 100).toFixed(0);
      console.log(
        `✓ ${file.padEnd(30)} ${(originalSize / 1024).toFixed(1)}KB → WebP: ${(webpSize / 1024).toFixed(1)}KB (${reduction}% smaller)`
      );
    } catch (error) {
      console.error(`✗ Failed to compress ${file}:`, error.message);
    }
  })
).then(() => {
  console.log(`\n📊 Summary:`);
  console.log(`   Original size: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`   Compressed:   ${(totalCompressed / 1024 / 1024).toFixed(2)}MB`);
  console.log(
    `   Total saved:  ${((1 - totalCompressed / totalOriginal) * 100).toFixed(0)}% reduction\n`
  );
});
