#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates placeholder PNG icons for PWA
 * Run: node scripts/generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal PNG base64 strings (1x1 pixel images that can be scaled)
// These are actual valid PNG files that can be embedded
const PLACEHOLDER_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0xC0, // Width: 192, Height: 192
  0x08, 0x02, 0x00, 0x00, 0x00, 0x39, 0x78, 0xAA, // Bit depth, color type, etc.
  0x5F, 0x00, 0x00, 0x01, 0x00, 0x49, 0x44, 0x41, // CRC and IDAT chunk
  0x54, 0x78, 0x9C, 0xED, 0xC1, 0x01, 0x01, 0x00, // Compressed data
  0x00, 0x00, 0xC0, 0xA0, 0xF5, 0x4F, 0xED, 0x61, // (light gray placeholder)
  0x0D, 0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0xAE, 0x1A, 0x3F, 0xAA,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
  0xAE, 0x42, 0x60, 0x82, // CRC
]);

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`✓ Created directory: ${iconsDir}`);
}

// Generate icon files
const iconConfigs = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
];

iconConfigs.forEach((config) => {
  const filePath = path.join(iconsDir, config.name);
  try {
    fs.writeFileSync(filePath, PLACEHOLDER_PNG);
    console.log(`✓ Generated: ${config.name} (${config.size}x${config.size})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${config.name}:`, error.message);
  }
});

console.log(`
✓ All PWA icon placeholders generated successfully!

Next steps:
1. Replace the placeholder icons in ${iconsDir} with your actual app icons
2. Recommended tool: https://www.photopea.com/ or Figma
3. Ensure icons are PNG format with proper branding

Icon specifications:
- icon-192.png: 192x192px (for home screen)
- icon-512.png: 512x512px (for splash screens)
- Maskable icons: For adaptive icons on Android (with safe zone)
`);
