// Script para generar iconos PWA desde Barberlogo1.PNG
// Ejecutar: node scripts/generate-pwa-icons.js

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

const inputImage = join(projectRoot, 'public', 'Barberlogo1.PNG');
const outputDir = join(projectRoot, 'public');

async function generateIcons() {
  if (!existsSync(inputImage)) {
    console.error('❌ No se encuentra Barberlogo1.PNG en /public');
    console.log('💡 Coloca tu logo en: public/Barberlogo1.PNG');
    process.exit(1);
  }

  console.log('🎨 Generando iconos PWA...\n');

  for (const { name, size } of sizes) {
    const outputPath = join(outputDir, name);
    
    try {
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${name} (${size}x${size}) generado`);
    } catch (error) {
      console.error(`❌ Error generando ${name}:`, error.message);
    }
  }

  console.log('\n✨ ¡Iconos PWA generados exitosamente!');
  console.log('📁 Ubicación: public/');
}

generateIcons().catch(console.error);
